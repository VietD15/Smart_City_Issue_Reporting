import { Request, Response } from "express";
import otpModel from "../../models/otp.model";
import authModel from "../../models/auth.model";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "../../utils/email.service";
import crypto from "crypto";

// Tạo mã OTP 6 chữ số
function generateOtp(): string {
  if (process.env.NODE_ENV !== "production") {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ----------------------------------------------------------------
// POST /api/v1/auth/otp/send
// Body: { email, type: "register" | "reset" | "login" }
// ----------------------------------------------------------------
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ success: false, message: "Thiếu email hoặc loại OTP" });
    }

    if (!["register", "reset", "login"].includes(type)) {
      return res.status(400).json({ success: false, message: "Loại OTP không hợp lệ" });
    }

    // Kiểm tra email tồn tại cho các loại phù hợp
    const userExists = await authModel.findOne({ email: email.toLowerCase() });

    if (type === "register" && userExists) {
      return res.status(400).json({ success: false, message: "Email này đã được đăng ký" });
    }

    if ((type === "reset" || type === "login") && !userExists) {
      return res.status(400).json({ success: false, message: "Email này chưa được đăng ký" });
    }

    // Xóa OTP cũ cùng email + type
    await otpModel.deleteMany({ email: email.toLowerCase(), type });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await otpModel.create({
      email: email.toLowerCase(),
      code,
      type,
      expiresAt,
      used: false,
    });

    // Gửi email - không dùng await để tránh treo request nếu SMTP chậm
    sendOtpEmail(email, code, type).catch(err => {
      console.error(`[OTP Email] Background failure sending to ${email}:`, err.message || err);
    });
    console.log(`[OTP Email] Dispatching ${type} code to ${email} in background...`);

    return res.status(200).json({
      success: true,
      message: `Mã OTP đã được gửi đến ${email}`,
      ...(process.env.NODE_ENV !== "production" ? { code } : {}),
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// ----------------------------------------------------------------
// POST /api/v1/auth/otp/verify
// Body: { email, code, type }
// ----------------------------------------------------------------
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin xác thực" });
    }

    const otp = await otpModel.findOne({
      email: email.toLowerCase(),
      type,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    if (otp.code !== code) {
      if (process.env.NODE_ENV !== "production" && code === "123456") {
        // Cho phép bỏ qua xác thực mã khi chạy ở local
      } else {
        return res.status(400).json({ success: false, message: "Mã OTP không đúng" });
      }
    }

    // Đánh dấu đã dùng
    otp.used = true;
    await otp.save();

    return res.status(200).json({
      success: true,
      message: "Xác thực OTP thành công",
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// ----------------------------------------------------------------
// POST /api/v1/auth/otp/reset-password
// Body: { email, code, newPassword }
// ----------------------------------------------------------------
export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // Kiểm tra OTP đã được verify (used = true) trong vòng 15 phút
    const verifiedOtp = await otpModel.findOne({
      email: email.toLowerCase(),
      type: "reset",
      used: true,
      // vẫn còn trong DB (chưa hết TTL)
    }).sort({ updatedAt: -1 });

    if (!verifiedOtp) {
      return res.status(400).json({ success: false, message: "Chưa xác thực OTP hoặc phiên đã hết hạn. Vui lòng thực hiện lại từ đầu." });
    }

    const user = await authModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Xóa OTP đã dùng
    await otpModel.deleteMany({ email: email.toLowerCase(), type: "reset" });

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    console.error("resetPasswordWithOtp error:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};
