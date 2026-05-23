import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Mail, Lock, User, Phone, MapPin, Eye, EyeOff,
  Loader2, CheckCircle2, Shield, Sparkles, ArrowRight, ArrowLeft, KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { VIETNAM_PROVINCES } from "../data/vietnamProvinces";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register, sendResetCode, verifyResetCode, resetPassword, sendRegisterCode, verifyRegisterCode, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "forgot-password" | "force-change-password">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [success, setSuccess] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register form
  const [regData, setRegData] = useState({
    name: "", email: "", phone: "", city: "", password: "", confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regCode, setRegCode] = useState("");

  // Forgot password form
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotData, setForgotData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [generatedCode, setGeneratedCode] = useState("");

  // Resend OTP logic
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOTP = async () => {
    if (resendTimer > 0 || isResending) return;
    
    setIsResending(true);
    let res;
    if (tab === "register") {
      res = await sendRegisterCode(regData.email);
    } else {
      res = await sendResetCode(forgotData.email);
      if (res.success && res.code) setGeneratedCode(res.code);
    }

    setIsResending(false);
    if (res?.success) {
      setResendTimer(60);
      toast.success("Mã xác thực mới đã được gửi!");
    } else {
      toast.error(res?.error || "Gửi lại mã thất bại");
    }
  };

  const resetAll = () => {
    setLoginData({ email: "", password: "" });
    setRegData({ name: "", email: "", phone: "", city: "", password: "", confirmPassword: "" });
    setForgotData({ email: "", code: "", newPassword: "", confirmNewPassword: "" });
    setLoginErrors({});
    setRegErrors({});
    setForgotErrors({});
    setSuccess(false);
    setShowPass(false);
    setShowConfirmPass(false);
    setForgotStep(1);
    setRegStep(1);
    setRegCode("");
    setGeneratedCode("");
    setResendTimer(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const switchTab = (t: "login" | "register" | "forgot-password" | "force-change-password") => {
    setTab(t);
    resetAll();
  };

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginData.email) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errs.email = "Email không hợp lệ";
    if (!loginData.password) errs.password = "Vui lòng nhập mật khẩu";
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs: Record<string, string> = {};
    const normalizedPhone = regData.phone.replace(/[\s.-]/g, "");
    if (!regData.name.trim()) errs.name = "Vui lòng nhập họ tên";
    if (!regData.email) errs.email = "Vui lòng nhập email";
    if (!regData.phone) errs.phone = "Vui lòng nhập số điện thoại";
    if (!regData.city) errs.city = "Vui lòng chọn tỉnh/thành";
    if (!regData.password) errs.password = "Vui lòng nhập mật khẩu";
    else if (regData.password.length < 6) errs.password = "Mật khẩu tối thiểu phải 6 ký tự";
    if (regData.password !== regData.confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (regData.email && !/\S+@\S+\.\S+/.test(regData.email)) errs.email = "Email không hợp lệ";
    if (regData.phone) {
      const isLocalPhone = /^0\d{9}$/.test(normalizedPhone);
      const isIntlPhone = /^\+84\d{9}$/.test(normalizedPhone);
      if (!isLocalPhone && !isIntlPhone) {
        errs.phone = "Số điện thoại phải đủ 10 số (hoặc +84 và 9 số)";
      }
    }
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    const res = await login(loginData.email, loginData.password);
    setLoading(false);
    if (res.success) {
      if (res.mustChangePassword) {
        setForgotData(prev => ({ ...prev, email: loginData.email }));
        setTab("force-change-password");
        toast.info("Bạn cần đổi mật khẩu trong lần đăng nhập đầu tiên");
        return;
      }
      setSuccess(true);
      toast.success("Đăng nhập thành công! Chào mừng bạn trở lại 👋");
      setTimeout(handleClose, 1200);
    } else {
      setLoginErrors({ general: res.error || "Đăng nhập thất bại" });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error("Đăng nhập Google thất bại: Không có credential");
      return;
    }
    setLoading(true);
    const res = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đăng nhập Google thành công! 👋");
      setTimeout(handleClose, 1200);
    } else {
      toast.error(res.error || "Đăng nhập Google thất bại");
    }
  };

  const handleRegisterStep1 = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    const res = await sendRegisterCode(regData.email);
    setLoading(false);
    
    if (res.success) {
      setRegStep(2);
      setResendTimer(60); // Khởi động bộ đếm
      if (res.code) {
        toast.success(`Mã xác thực đã được gửi đến ${regData.email}. Mã của bạn là: ${res.code}`);
      } else {
        toast.success(`Mã xác thực đã được gửi đến ${regData.email}. Vui lòng kiểm tra hộp thư đến hoặc thư rác (Spam).`);
      }
      if (process.env.NODE_ENV !== "production") {
        toast.info("Đang chạy ở môi trường local, mã OTP mặc định là: 123456", { duration: 8000 });
      }
    } else {
      setRegErrors({ general: res.error || "Không thể gửi OTP" });
    }
  };

  const handleRegisterStep2 = async () => {
    if (!regCode || regCode.length !== 6) {
      setRegErrors({ code: "Vui lòng nhập mã xác thực gồm 6 chữ số" });
      return;
    }
    
    setLoading(true);
    const verifyRes = await verifyRegisterCode(regData.email, regCode);
    
    if (!verifyRes.success) {
      setLoading(false);
      setRegErrors({ general: verifyRes.error || "Mã xác thực không đúng" });
      return;
    }
    
    const res = await register({
      name: regData.name,
      email: regData.email,
      password: regData.password,
      phone: regData.phone,
      city: regData.city,
    });
    setLoading(false);
    
    if (res.success) {
      setSuccess(true);
      toast.success("Đăng ký tài khoản thành công! 🎉");
      setTimeout(handleClose, 2000);
    } else {
      setRegErrors({ general: res.error || "Đăng ký thất bại" });
    }
  };

  const handleForgotStep1 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.email) errs.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(forgotData.email)) errs.email = "Email không hợp lệ";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await sendResetCode(forgotData.email);
    setLoading(false);
    if (res.success) {
      setGeneratedCode(res.code || "");
      setForgotStep(2);
      setResendTimer(60); // Khởi động bộ đếm
      if (res.code) {
        toast.success(`Mã xác thực đã được gửi đến ${forgotData.email}. Mã của bạn là: ${res.code}`);
      } else {
        toast.success(`Mã xác thực đã được gửi đến ${forgotData.email}. Vui lòng kiểm tra hộp thư đến hoặc thư rác (Spam).`);
      }
    } else {
      setForgotErrors({ general: res.error || "Gửi mã thất bại" });
    }
  };

  const handleForgotStep2 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.code) errs.code = "Vui lòng nhập mã xác thực";
    else if (forgotData.code.length !== 6) errs.code = "Mã xác thực phải có 6 chữ số";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await verifyResetCode(forgotData.email, forgotData.code);
    setLoading(false);
    if (res.success) {
      setForgotStep(3);
      toast.success("Mã xác thực đúng! Vui lòng nhập mật khẩu mới");
    } else {
      setForgotErrors({ general: res.error || "Xác thực thất bại" });
    }
  };

  const handleForgotStep3 = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (forgotData.newPassword.length < 6) errs.newPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (forgotData.newPassword !== forgotData.confirmNewPassword) errs.confirmNewPassword = "Mật khẩu xác nhận không khớp";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await resetPassword(forgotData.email, forgotData.code, forgotData.newPassword);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại");
      setTimeout(() => {
        switchTab("login");
        handleClose();
      }, 1500);
    } else {
      setForgotErrors({ general: res.error || "Đổi mật khẩu thất bại" });
    }
  };

  const { forceChangePassword } = useAuth();
  const handleForceChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!forgotData.newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (forgotData.newPassword.length < 6) errs.newPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (forgotData.newPassword !== forgotData.confirmNewPassword) errs.confirmNewPassword = "Mật khẩu xác nhận không khớp";
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await forceChangePassword(forgotData.newPassword);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      toast.success("Đổi mật khẩu thành công! Giờ bạn có thể sử dụng hệ thống.");
      setTimeout(handleClose, 1500);
    } else {
      setForgotErrors({ general: res.error || "Đổi mật khẩu thất bại" });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Decorative top */}
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-400 to-red-600" />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X size={16} className="text-gray-500" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-black text-[#1a1a2e] text-lg">Báo Cáo</span>
                  <span className="font-black text-red-600 text-lg">VN</span>
                </div>
              </div>

              {/* Success State */}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 size={40} className="text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
                      {tab === "login" ? "Đăng nhập thành công!" : tab === "register" ? "Đăng ký thành công!" : "Đổi mật khẩu thành công!"}
                    </h3>
                    <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
                      {(["login", "register"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => switchTab(t)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t === "login" ? "Đăng nhập" : "Đăng ký"}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {tab === "login" ? (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <div>
                            <h2 className="text-2xl font-black text-gray-900">Chào mừng trở lại!</h2>
                            <p className="text-gray-500 text-sm mt-1">Đăng nhập để báo cáo và theo dõi vấn đề</p>
                          </div>

                          {loginErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {loginErrors.general}
                            </motion.div>
                          )}

                          <InputField
                            icon={Mail}
                            type="email"
                            placeholder="Email của bạn"
                            value={loginData.email}
                            onChange={(v) => setLoginData((d) => ({ ...d, email: v }))}
                            error={loginErrors.email}
                          />
                          <InputField
                            icon={Lock}
                            type={showPass ? "text" : "password"}
                            placeholder="Mật khẩu"
                            value={loginData.password}
                            onChange={(v) => setLoginData((d) => ({ ...d, password: v }))}
                            error={loginErrors.password}
                            rightIcon={
                              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />

                          <div className="text-right">
                            <button className="text-sm text-red-600 hover:underline" onClick={() => switchTab("forgot-password")}>Quên mật khẩu?</button>
                          </div>

                          <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                          >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                          </button>

                          <div className="relative flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">hoặc đăng nhập với</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>

                           <div className="flex justify-center">
                            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                              <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error("Đăng nhập Google thất bại")}
                                useOneTap
                                theme="outline"
                                shape="pill"
                                text="signin_with"
                              />
                            ) : (
                              <button
                                onClick={() => toast.error("Đăng nhập Google chưa được cấu hình. Vui lòng thiết lập biến môi trường VITE_GOOGLE_CLIENT_ID ở Vercel.", { duration: 6000 })}
                                className="flex items-center justify-center gap-2.5 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm text-gray-700 font-semibold shadow-sm"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                Đăng nhập bằng Google (Chưa cấu hình)
                              </button>
                            )}
                          </div>

                          <p className="text-center text-sm text-gray-500">
                            Chưa có tài khoản?{" "}
                            <button onClick={() => switchTab("register")} className="text-red-600 font-semibold hover:underline">
                              Đăng ký ngay
                            </button>
                          </p>
                        </motion.div>
                      ) : tab === "register" ? (
                        <motion.div
                          key="register"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3"
                        >
                          {regStep === 1 ? (
                            <motion.div key="reg1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                              <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                  Tạo tài khoản
                                  <Sparkles size={20} className="text-yellow-400" />
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Tham gia cộng đồng xây dựng Việt Nam tốt đẹp hơn</p>
                              </div>

                              {regErrors.general && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
                                  <X size={14} />
                                  {regErrors.general}
                                </motion.div>
                              )}

                              <InputField
                                icon={User}
                                placeholder="Họ và tên"
                                value={regData.name}
                                onChange={(v) => {
                                  setRegData((d) => ({ ...d, name: v }));
                                  if (regErrors.name) setRegErrors((e) => ({ ...e, name: "" }));
                                }}
                                error={regErrors.name}
                              />
                              <InputField
                                icon={Mail}
                                type="email"
                                placeholder="Email"
                                value={regData.email}
                                onChange={(v) => {
                                  setRegData((d) => ({ ...d, email: v }));
                                  if (regErrors.email) setRegErrors((e) => ({ ...e, email: "" }));
                                }}
                                error={regErrors.email}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <InputField
                                  icon={Phone}
                                  placeholder="Số điện thoại"
                                  value={regData.phone}
                                  onChange={(v) => {
                                    setRegData((d) => ({ ...d, phone: v }));
                                    if (regErrors.phone) setRegErrors((e) => ({ ...e, phone: "" }));
                                  }}
                                  error={regErrors.phone}
                                />
                                <div className="relative">
                                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <select
                                    value={regData.city}
                                    onChange={(e) => {
                                      setRegData((d) => ({ ...d, city: e.target.value }));
                                      if (regErrors.city) setRegErrors((err) => ({ ...err, city: "" }));
                                    }}
                                    className={`w-full pl-10 pr-3 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm bg-white text-gray-600 ${
                                      regErrors.city ? "border-red-300 bg-red-50 focus:ring-red-100" : "border-gray-200 focus:ring-red-300"
                                    }`}
                                  >
                                    <option value="">Tỉnh/Thành</option>
                                    {VIETNAM_PROVINCES.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  {regErrors.city && (
                                    <motion.p
                                      initial={{ opacity: 0, y: -4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="text-red-500 text-xs mt-1 ml-1"
                                    >
                                      {regErrors.city}
                                    </motion.p>
                                  )}
                                </div>
                              </div>

                              <InputField
                                icon={Lock}
                                type={showPass ? "text" : "password"}
                                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                                value={regData.password}
                                onChange={(v) => {
                                  setRegData((d) => ({ ...d, password: v }));
                                  if (regErrors.password) setRegErrors((e) => ({ ...e, password: "" }));
                                }}
                                error={regErrors.password}
                                rightIcon={
                                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                }
                              />

                              <InputField
                                icon={Lock}
                                type={showConfirmPass ? "text" : "password"}
                                placeholder="Xác nhận mật khẩu"
                                value={regData.confirmPassword}
                                onChange={(v) => {
                                  setRegData((d) => ({ ...d, confirmPassword: v }));
                                  if (regErrors.confirmPassword) setRegErrors((e) => ({ ...e, confirmPassword: "" }));
                                }}
                                error={regErrors.confirmPassword}
                                rightIcon={
                                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-gray-600">
                                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                }
                              />

                              <button
                                onClick={handleRegisterStep1} disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                              >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                {loading ? "Đang gửi..." : "Tiếp tục"}
                              </button>

                              <div className="relative flex items-center gap-3 py-2">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400">hoặc đăng ký nhanh với</span>
                                <div className="flex-1 h-px bg-gray-200" />
                              </div>

                              <div className="flex justify-center">
                                <GoogleLogin
                                  onSuccess={handleGoogleSuccess}
                                  onError={() => toast.error("Đăng ký Google thất bại")}
                                  useOneTap
                                  theme="outline"
                                  shape="pill"
                                  text="signup_with"
                                />
                              </div>

                              <p className="text-center text-sm text-gray-500">
                                Đã có tài khoản?{" "}
                                <button onClick={() => switchTab("login")} className="text-red-600 font-semibold hover:underline">
                                  Đăng nhập
                                </button>
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div key="reg2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                              <button onClick={() => setRegStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
                                <ArrowLeft size={14} /> Quay lại
                              </button>

                              <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">Xác thực Email</h2>
                                <p className="text-gray-500 text-sm mt-1">Nhập mã xác thực đã được gửi đến email đăng ký của bạn</p>
                              </div>

                              {regErrors.general && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
                                  <X size={14} />
                                  {regErrors.general}
                                </motion.div>
                              )}

                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <p className="text-sm text-blue-900">📧 Mã xác thực đã được gửi đến <span className="font-semibold">{regData.email}</span></p>
                              </div>

                              <InputField icon={KeyRound} type="text" placeholder="Nhập mã 6 chữ số" value={regCode} onChange={(v) => setRegCode(v)} error={regErrors.code} />
                               
                              <div className="flex justify-between items-center text-xs px-1">
                                <span className="text-gray-500">Chưa nhận được mã?</span>
                                <button 
                                  onClick={handleResendOTP}
                                  disabled={resendTimer > 0 || isResending}
                                  className={`font-semibold transition-colors ${resendTimer > 0 || isResending ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                                >
                                  {isResending ? "Đang gửi..." : resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : "Gửi lại mã"}
                                </button>
                              </div>

                              <button
                                onClick={handleRegisterStep2} disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                              >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                {loading ? "Đang xử lý..." : "Xác thực & Tạo tài khoản"}
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      ) : tab === "force-change-password" ? (
                        <motion.div
                          key="force-change-password"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                              <Shield size={24} className="text-red-600" />
                              Yêu cầu đổi mật khẩu
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                              Vì lý do bảo mật, bạn cần đổi mật khẩu trong lần đăng nhập đầu tiên.
                            </p>
                          </div>

                          {forgotErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {forgotErrors.general}
                            </motion.div>
                          )}

                          <InputField
                            icon={Lock}
                            type={showPass ? "text" : "password"}
                            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                            value={forgotData.newPassword}
                            onChange={(v) => setForgotData((d) => ({ ...d, newPassword: v }))}
                            error={forgotErrors.newPassword}
                            rightIcon={
                              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />
                          <InputField
                            icon={Lock}
                            type={showConfirmPass ? "text" : "password"}
                            placeholder="Xác nhận mật khẩu mới"
                            value={forgotData.confirmNewPassword}
                            onChange={(v) => setForgotData((d) => ({ ...d, confirmNewPassword: v }))}
                            error={forgotErrors.confirmNewPassword}
                            rightIcon={
                              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-gray-600">
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />

                          {forgotData.newPassword && (
                            <PasswordStrength password={forgotData.newPassword} />
                          )}

                          <button
                            onClick={handleForceChangePassword}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                          >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            {loading ? "Đang cập nhật..." : "Xác nhận & Hoàn tất"}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="forgot-password"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          {/* Back button */}
                          <button
                            onClick={() => switchTab("login")}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
                          >
                            <ArrowLeft size={14} />
                            Quay lại đăng nhập
                          </button>

                          <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                              <KeyRound size={24} className="text-red-600" />
                              Khôi phục mật khẩu
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                              {forgotStep === 1 && "Nhập email để nhận mã xác thực"}
                              {forgotStep === 2 && "Nhập mã xác thực đã gửi đến email"}
                              {forgotStep === 3 && "Nhập mật khẩu mới của bạn"}
                            </p>
                          </div>

                          {/* Progress indicator */}
                          <div className="flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                              <div key={step} className="flex items-center flex-1">
                                <div
                                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                    step <= forgotStep ? "bg-red-500" : "bg-gray-200"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {forgotErrors.general && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm"
                            >
                              <X size={14} />
                              {forgotErrors.general}
                            </motion.div>
                          )}

                          <AnimatePresence mode="wait">
                            {forgotStep === 1 && (
                              <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <InputField
                                  icon={Mail}
                                  type="email"
                                  placeholder="Email đã đăng ký"
                                  value={forgotData.email}
                                  onChange={(v) => setForgotData((d) => ({ ...d, email: v }))}
                                  error={forgotErrors.email}
                                />

                                <button
                                  onClick={handleForgotStep1}
                                  disabled={loading}
                                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                >
                                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                  {loading ? "Đang gửi..." : "Gửi mã xác thực"}
                                </button>
                              </motion.div>
                            )}

                            {forgotStep === 2 && (
                              <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                  <p className="text-sm text-blue-900">
                                    📧 Mã xác thực đã được gửi đến <span className="font-semibold">{forgotData.email}</span>
                                  </p>
                                  {generatedCode && (
                                    <p className="text-xs text-blue-700 mt-2 font-mono bg-white px-2 py-1 rounded">
                                      Mã xác thực: {generatedCode}
                                    </p>
                                  )}
                                </div>

                                <InputField
                                  icon={KeyRound}
                                  type="text"
                                  placeholder="Nhập mã 6 chữ số"
                                  value={forgotData.code}
                                  onChange={(v) => setForgotData((d) => ({ ...d, code: v }))}
                                  error={forgotErrors.code}
                                />

                                <div className="flex justify-between items-center text-xs px-1">
                                  <span className="text-gray-500">Chưa nhận được mã?</span>
                                  <button 
                                    onClick={handleResendOTP}
                                    disabled={resendTimer > 0 || isResending}
                                    className={`font-semibold transition-colors ${resendTimer > 0 || isResending ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                                  >
                                    {isResending ? "Đang gửi..." : resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : "Gửi lại mã"}
                                  </button>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setForgotStep(1)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Quay lại
                                  </button>
                                  <button
                                    onClick={handleForgotStep2}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                  >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                    {loading ? "Đang xác thực..." : "Xác thực"}
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {forgotStep === 3 && (
                              <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                              >
                                <InputField
                                  icon={Lock}
                                  type={showPass ? "text" : "password"}
                                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                  value={forgotData.newPassword}
                                  onChange={(v) => setForgotData((d) => ({ ...d, newPassword: v }))}
                                  error={forgotErrors.newPassword}
                                  rightIcon={
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  }
                                />
                                <InputField
                                  icon={Lock}
                                  type={showConfirmPass ? "text" : "password"}
                                  placeholder="Xác nhận mật khẩu mới"
                                  value={forgotData.confirmNewPassword}
                                  onChange={(v) => setForgotData((d) => ({ ...d, confirmNewPassword: v }))}
                                  error={forgotErrors.confirmNewPassword}
                                  rightIcon={
                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-gray-400 hover:text-gray-600">
                                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  }
                                />

                                {forgotData.newPassword && (
                                  <PasswordStrength password={forgotData.newPassword} />
                                )}

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setForgotStep(2)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Quay lại
                                  </button>
                                  <button
                                    onClick={handleForgotStep3}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                                  >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function InputField({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  rightIcon,
}: {
  icon: any;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div>
      <div className={`relative flex items-center border rounded-xl transition-all duration-200 ${error ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"}`}>
        <Icon size={16} className={`absolute left-3.5 ${error ? "text-red-400" : "text-gray-400"} flex-shrink-0`} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-transparent rounded-xl focus:outline-none text-sm text-gray-800 placeholder-gray-400"
        />
        {rightIcon && <div className="absolute right-3.5">{rightIcon}</div>}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Ít nhất 6 ký tự", ok: password.length >= 6 },
    { label: "Chữ hoa", ok: /[A-Z]/.test(password) },
    { label: "Số", ok: /[0-9]/.test(password) },
    { label: "Ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#10b981"];
  const labels = ["Yếu", "Trung bình", "Khá", "Mạnh"];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < strength ? colors[strength - 1] : "#e5e7eb" }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className="text-xs" style={{ color: colors[strength - 1] }}>
          Độ bảo mật: {labels[strength - 1]}
        </p>
      )}
    </motion.div>
  );
}