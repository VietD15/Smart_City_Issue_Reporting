import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Search, Shield, ShieldAlert, Ban, LockKeyhole, Unlock,
  AlertTriangle, Bell, X, Clock, Calendar, CheckCircle2, FileText,
  Mail, Phone, MapPin, Plus, Edit2, Eye, EyeOff, ChevronDown,
  UserCheck, UserX, UserCog, Key, RefreshCw, Filter, Loader2,
  Save, Info, Trash2,
} from "lucide-react";
import { Navigate } from "react-router";
import { useAuth, User } from "../context/AuthContext";
import { useRoles } from "../context/RolesContext";
import { toast } from "sonner";
import { PageTitle } from "../components/PageTitle";
import { api } from "../../utils/api";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/ui/skeleton";
import { Card } from "../components/ui/card";
import { CATEGORY_LABELS } from "../data/issues";

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────

const BAN_LEVELS = {
  "24h": { label: "24 giờ", duration: 24 * 60 * 60 * 1000 },
  "3days": { label: "3 ngày", duration: 3 * 24 * 60 * 60 * 1000 },
  "1month": { label: "1 tháng", duration: 30 * 24 * 60 * 60 * 1000 },
  permanent: { label: "Vĩnh viễn", duration: Infinity },
};

const ROLE_CONFIG = {
  admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500", icon: Shield },
  moderator: { label: "Cán bộ", color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", icon: UserCheck },
  user: { label: "Công dân", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", icon: Users },
};

const normalizeRole = (roleStr: string): "admin" | "moderator" | "user" => {
  if (!roleStr) return "user";
  const r = roleStr.toLowerCase();
  if (r.includes("admin")) return "admin";
  if (r.includes("cán bộ") || r.includes("moderator") || r.includes("staff")) return "moderator";
  return "user";
};

// ──────────────────────────────────────────────────────────
// API helpers
// ──────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://smart-city-issue-reporting-8c16.onrender.com/api/v1" : "http://localhost:8081/api/v1");

async function fetchUsersFromAPI(): Promise<Array<User & { password: string }>> {
  try {
    const data = await api.get("/auth/users?limit=500");
    if (data.success && data.users) {
      return data.users.map((u: any) => ({
        id: u.user_id || u._id || u.id,
        name: u.name || u.userName || u.username || "Người dùng",
        email: u.email,
        phone: u.phone,
        city: u.city,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.username || u.userName || 'user')}`,
        joinedAt: u.created_at || u.createdAt || new Date().toISOString(),
        reportsCount: u.reportsCount || 0,
        resolvedCount: u.resolvedCount || 0,
        role: normalizeRole(u.role || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : "user")),
        roleId: u.roleId || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : undefined),
        banned: u.banned || (u.lockEnd && new Date(u.lockEnd) > new Date()),
        banReason: u.lockReason || u.banReason,
        managementScope: u.managementScope || [],
        password: "",
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

// Role badge
function RoleBadge({ role }: { role: "admin" | "moderator" | "user" }) {
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// Status badge
function StatusBadge({ banned }: { banned?: boolean }) {
  return banned ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      <Ban size={10} /> Đã khóa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={10} /> Hoạt động
    </span>
  );
}

// ──────────────────────────────────────────────────────────
// Create Account Modal
// ──────────────────────────────────────────────────────────
function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: User & { password: string }) => void;
}) {
  const { roles } = useRoles();
  const activeRoles = roles.filter((r) => r.isActive);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "TP. Hồ Chí Minh",
    roleId: activeRoles.length > 0 ? activeRoles[0].id : "",
    managementScope: [] as string[],
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cities = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
  ];

  const selectedRole = roles.find((r) => r.id === form.roleId);
  const isModerator = selectedRole && normalizeRole(selectedRole.name) === "moderator";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.roleId) e.roleId = "Vui lòng chọn vai trò";
    if (isModerator && form.managementScope.length === 0) {
      e.managementScope = "Vui lòng chọn ít nhất một lĩnh vực phụ trách";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);

    const roleName = selectedRole?.name || "user";
    const randomPassword = Math.random().toString(36).slice(-10) + Math.floor(Math.random() * 10);

    try {
      const res = await api.post("/auth/users", {
        userName: form.email.trim().toLowerCase(), // Gửi email làm userName
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: randomPassword,
        roleIds: [form.roleId],
        sendEmail: true,
        forcePasswordChange: true,
        managementScope: form.managementScope,
        city: form.city,
        phone: form.phone.trim()
      });

      if (!res.success) {
        toast.error(res.message || "Tạo tài khoản thất bại");
        return;
      }

      const data = res.data || res;
      const userData = data.user || data;
      const newUser: User & { password: string } = {
        id: userData.user_id || userData._id || userData.id || Math.random().toString(36).substr(2, 9),
        name: userData.name || userData.fullName || userData.userName || form.name.trim(),
        email: userData.email || form.email.trim().toLowerCase(),
        password: "",
        phone: form.phone.trim() || undefined,
        city: form.city,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name || form.name)}`,
        joinedAt: userData.createdAt || new Date().toISOString(),
        reportsCount: 0,
        resolvedCount: 0,
        role: normalizeRole(roleName),
        managementScope: form.managementScope
      };

      onCreated(newUser);
      onClose();
      setForm({ name: "", email: "", phone: "", city: "Thành phố Đà Nẵng", roleId: "", managementScope: [] });
      toast.success(`✅ Đã tạo tài khoản ${roleName} và gửi thông tin qua email: ${newUser.email}`);
    } catch (err) {
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tạo tài khoản mới</h2>
                <p className="text-xs text-gray-400">Gán vai trò và tạo tài khoản người dùng</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCog size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <select
                value={form.roleId}
                onChange={(e) => set("roleId", e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none bg-white ${errors.roleId ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
              >
                <option value="">-- Chọn vai trò --</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.permissionIds.length} quyền)
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.roleId && <p className="text-xs text-red-500 mt-1">{errors.roleId}</p>}

            {/* Role info */}
            {selectedRole && (
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-800">{selectedRole.name}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">{selectedRole.description}</p>
                    <p className="text-xs text-indigo-500 mt-1">
                      <strong>{selectedRole.permissionIds.length} quyền</strong> được gán
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeRoles.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                Chưa có vai trò nào. Vui lòng tạo vai trò trong Quản lý vai trò trước.
              </p>
            )}
          </div>

          {/* Lĩnh vực phụ trách cho Cán bộ */}
          {isModerator && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
              <label className="block text-sm font-semibold text-indigo-900">
                Lĩnh vực phụ trách <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                  const isChecked = form.managementScope.includes(catKey);
                  return (
                    <label key={catKey} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const newScope = isChecked
                            ? form.managementScope.filter((s) => s !== catKey)
                            : [...form.managementScope, catKey];
                          setForm((prev) => ({ ...prev, managementScope: newScope }));
                          setErrors((prev) => ({ ...prev, managementScope: "" }));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {catLabel}
                    </label>
                  );
                })}
              </div>
              {errors.managementScope && <p className="text-xs text-red-500 mt-1">{errors.managementScope}</p>}
            </div>
          )}

          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Nguyễn Văn Minh"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.name ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="canbo@baocaovn.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.email ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Info box about random password */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Mật khẩu tự động</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                Hệ thống sẽ tự động tạo mật khẩu ngẫu nhiên và gửi đến email <strong>{form.email || "của người dùng"}</strong>.
                Người dùng sẽ được yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên.
              </p>
            </div>
          </div>

          {/* Phone + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="09x xxx xxxx"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-indigo-400 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thành phố</label>
              <select
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-indigo-400 focus:ring-indigo-100 transition-all"
              >
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Tài khoản sẽ có thể đăng nhập ngay lập tức sau khi tạo với vai trò <strong>{selectedRole?.name || "được chọn"}</strong>.
              {selectedRole && ` Vai trò này có ${selectedRole.permissionIds.length} quyền được gán.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-3xl px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || activeRoles.length === 0}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200 transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {activeRoles.length === 0 ? "Chưa có vai trò" : "Tạo tài khoản"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Change Role Modal
// ──────────────────────────────────────────────────────────
function ChangeRoleModal({
  target,
  currentAdminId,
  onClose,
  onSaved,
}: {
  target: User;
  currentAdminId: string;
  onClose: () => void;
  onSaved: (newRoleId: string, managementScope: string[]) => void;
}) {
  const { roles } = useRoles();
  const activeRoles = roles.filter((r) => r.isActive);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(target.roleId || "");
  const [managementScope, setManagementScope] = useState<string[]>(target.managementScope || []);
  const [loading, setLoading] = useState(false);
  const [scopeError, setScopeError] = useState("");

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSelectedRoleModerator = selectedRole && normalizeRole(selectedRole.name) === "moderator";

  const handleSave = async () => {
    if (!selectedRoleId) return;
    if (isSelectedRoleModerator && managementScope.length === 0) {
      setScopeError("Vui lòng chọn ít nhất một lĩnh vực phụ trách");
      return;
    }
    setLoading(true);
    // API call will be handled by the onSaved callback which calls updateUser
    onSaved(selectedRoleId, isSelectedRoleModerator ? managementScope : []);
    setLoading(false);
    onClose();
  };

  const currentRole = roles.find((r) => r.id === target.roleId);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <UserCog size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Phân quyền tài khoản</h2>
                <p className="text-xs text-gray-400">Thay đổi vai trò người dùng</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-5">
            <img src={target.avatar} alt={target.name} className="w-12 h-12 rounded-full ring-2 ring-white shadow" />
            <div>
              <p className="font-semibold text-gray-900">{target.name}</p>
              <p className="text-xs text-gray-500">{target.email}</p>
              {currentRole && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    {currentRole.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Role Options */}
          <p className="text-sm font-semibold text-gray-700 mb-3">Chọn vai trò mới</p>
          <div className="space-y-2.5">
            {activeRoles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const isCurrent = target.roleId === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${isSelected
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-100 hover:border-gray-300 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? "bg-violet-100" : "bg-gray-100"}`}>
                      <Shield size={16} className={isSelected ? "text-violet-600" : "text-gray-500"} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${isSelected ? "text-violet-700" : "text-gray-700"}`}>{role.name}</p>
                        {isCurrent && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Hiện tại</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{role.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {role.permissionIds.length} quyền được gán
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lĩnh vực phụ trách cho Cán bộ khi đổi vai trò */}
          {isSelectedRoleModerator && (
            <div className="mt-4 p-4 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-2">
              <label className="block text-sm font-semibold text-violet-900">
                Lĩnh vực phụ trách <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                  const isChecked = managementScope.includes(catKey);
                  return (
                    <label key={catKey} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const newScope = isChecked
                            ? managementScope.filter((s) => s !== catKey)
                            : [...managementScope, catKey];
                          setManagementScope(newScope);
                          setScopeError("");
                        }}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      {catLabel}
                    </label>
                  );
                })}
              </div>
              {scopeError && <p className="text-xs text-red-500 mt-1">{scopeError}</p>}
            </div>
          )}

          {activeRoles.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Chưa có vai trò nào được kích hoạt. Vui lòng tạo vai trò trong Quản lý vai trò trước.
                </p>
              </div>
            </div>
          )}

          {selectedRoleId !== target.roleId && selectedRole && currentRole && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Thay đổi từ <strong>{currentRole.name}</strong> → <strong>{selectedRole.name}</strong>.
                Người dùng sẽ có {selectedRole.permissionIds.length} quyền mới.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 text-sm">Hủy</button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedRoleId || activeRoles.length === 0 || (selectedRoleId === target.roleId && JSON.stringify(managementScope) === JSON.stringify(target.managementScope || []))}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-200 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Ban Modal
// ──────────────────────────────────────────────────────────
function BanModal({
  target,
  onClose,
  onBanned,
}: {
  target: User;
  onClose: () => void;
  onBanned: (updates: Partial<User>) => void;
}) {
  const [level, setLevel] = useState<keyof typeof BAN_LEVELS>("24h");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do khóa"); return; }
    setLoading(true);
    const now = new Date();
    const dur = BAN_LEVELS[level].duration;
    const bannedUntil = dur === Infinity ? "permanent" : new Date(now.getTime() + dur).toISOString();
    onBanned({ banned: true, banReason: reason.trim(), banLevel: level, bannedAt: now.toISOString(), bannedUntil });
    setLoading(false);
    toast.success(`🔒 Đã khóa tài khoản ${target.name} (${BAN_LEVELS[level].label})`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <LockKeyhole size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Khóa tài khoản</h2>
                <p className="text-xs text-gray-400">Hạn chế quyền đăng nhập</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* User */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
            <img src={target.avatar} alt={target.name} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{target.name}</p>
              <p className="text-xs text-gray-500">{target.email}</p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thời hạn khóa</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BAN_LEVELS) as [keyof typeof BAN_LEVELS, { label: string }][]).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setLevel(key)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${level === key ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  {key === "permanent" ? "🔒 " : "⏱ "}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do khóa <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả lý do khóa tài khoản..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Tài khoản bị khóa sẽ <strong>không thể đăng nhập</strong> cho đến khi được mở khóa hoặc hết thời hạn.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 text-sm">Hủy</button>
            <button
              onClick={handleBan}
              disabled={loading || !reason.trim()}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <LockKeyhole size={14} />}
              Khóa tài khoản
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Edit Password Modal
// ──────────────────────────────────────────────────────────
function EditPasswordModal({
  target,
  onClose,
  onSaved,
}: {
  target: User & { password: string };
  onClose: () => void;
  onSaved: (newPassword: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!newPassword) e.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 6) e.newPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (newPassword !== confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp";

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    onSaved(newPassword);
    setLoading(false);
    toast.success(`✅ Đã đổi mật khẩu cho: ${target.name}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Key size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Đổi mật khẩu</h2>
                <p className="text-xs text-gray-400">Cập nhật mật khẩu đăng nhập</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <img src={target.avatar} alt={target.name} className="w-12 h-12 rounded-full ring-2 ring-white shadow" />
            <div>
              <p className="font-semibold text-gray-900">{target.name}</p>
              <p className="text-xs text-gray-500">{target.email}</p>
              <div className="mt-1"><RoleBadge role={target.role} /></div>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.newPassword ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="Nhập lại mật khẩu mới"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  }`}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
            <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập vào lần tiếp theo.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 text-sm">
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-200 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu mật khẩu
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Delete Account Modal
// ──────────────────────────────────────────────────────────
function DeleteAccountModal({
  target,
  onClose,
  onDeleted,
}: {
  target: User;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== target.email) {
      toast.error("Email xác nhận không đúng");
      return;
    }

    setLoading(true);
    await onDeleted();
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Xóa tài khoản</h2>
                <p className="text-xs text-gray-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
            <img src={target.avatar} alt={target.name} className="w-12 h-12 rounded-full ring-2 ring-white shadow" />
            <div>
              <p className="font-semibold text-gray-900">{target.name}</p>
              <p className="text-xs text-gray-500">{target.email}</p>
              <div className="mt-1"><RoleBadge role={target.role} /></div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Cảnh báo nghiêm trọng!</p>
                <p className="text-xs text-red-700 mt-1">
                  Xóa tài khoản sẽ <strong>xóa vĩnh viễn</strong> tất cả dữ liệu liên quan:
                </p>
                <ul className="text-xs text-red-700 mt-2 space-y-1 ml-4">
                  <li>• Tất cả báo cáo đã tạo ({target.reportsCount} báo cáo)</li>
                  <li>• Lịch sử hoạt động và bình luận</li>
                  <li>• Quyền truy cập vào hệ thống</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirm Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nhập email để xác nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={target.email}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
            <p className="text-xs text-gray-500 mt-1">Nhập chính xác: <code className="bg-gray-100 px-1 py-0.5 rounded">{target.email}</code></p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 text-sm">
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== target.email}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// User Detail Drawer
// ──────────────────────────────────────────────────────────
function UserDetailDrawer({
  target,
  onClose,
}: {
  target: User & { password: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-40 flex items-center justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white h-full w-full max-w-sm shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Chi tiết tài khoản</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
          </div>

          {/* Avatar */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <img src={target.avatar} alt={target.name} className="w-24 h-24 rounded-full ring-4 ring-white shadow-lg mx-auto" />
              {target.banned && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Ban size={14} className="text-white" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 mt-3">{target.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <RoleBadge role={target.role} />
              <StatusBadge banned={target.banned} />
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            {[
              { icon: Mail, label: "Email", value: target.email },
              { icon: Phone, label: "Điện thoại", value: target.phone || "Chưa cập nhật" },
              { icon: MapPin, label: "Thành phố", value: target.city || "Chưa cập nhật" },
              { icon: Calendar, label: "Ngày tham gia", value: new Date(target.joinedAt).toLocaleDateString("vi-VN") },
              { icon: FileText, label: "Số báo cáo", value: `${target.reportsCount} báo cáo` },
              { icon: CheckCircle2, label: "Đã giải quyết", value: `${target.resolvedCount} báo cáo` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon size={15} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lĩnh vực phụ trách */}
          {target.role === "moderator" && target.managementScope && target.managementScope.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-150 rounded-xl">
              <p className="text-sm font-semibold text-indigo-800 mb-1">Lĩnh vực phụ trách</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {target.managementScope.map((scopeVal) => (
                  <span key={scopeVal} className="inline-flex items-center px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-100 text-xs font-medium">
                    {CATEGORY_LABELS[scopeVal as keyof typeof CATEGORY_LABELS] || scopeVal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ban info */}
          {target.banned && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Bị khóa · {target.banLevel && BAN_LEVELS[target.banLevel]?.label}
                  </p>
                  <p className="text-xs text-red-700">{target.banReason}</p>
                  {target.bannedUntil && target.bannedUntil !== "permanent" && (
                    <p className="text-xs text-red-500 mt-1">Mở khóa: {new Date(target.bannedUntil).toLocaleString("vi-VN")}</p>
                  )}
                  {target.bannedUntil === "permanent" && (
                    <p className="text-xs text-red-500 mt-1">Khóa vĩnh viễn</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {target.warnings && target.warnings.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Lịch sử cảnh báo ({target.warnings.length})</p>
              <div className="space-y-2">
                {target.warnings.map((w) => (
                  <div key={w.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs font-medium text-yellow-800">{w.reason}</p>
                    <p className="text-xs text-yellow-600 mt-0.5">{new Date(w.createdAt).toLocaleDateString("vi-VN")} · {w.adminName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────
type FilterRole = "all" | "admin" | "moderator" | "user";
type FilterStatus = "all" | "active" | "banned";

export function AdminUsersPage() {
  const { user, can, isLoading } = useAuth();
  const [users, setUsers] = useState<Array<User & { password: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = useState<(User & { password: string }) | null>(null);
  const [banTarget, setBanTarget] = useState<(User & { password: string }) | null>(null);
  const [detailTarget, setDetailTarget] = useState<(User & { password: string }) | null>(null);
  const [editPasswordTarget, setEditPasswordTarget] = useState<(User & { password: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(User & { password: string }) | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    const apiUsers = await fetchUsersFromAPI();
    if (apiUsers.length > 0) {
      setUsers(apiUsers);
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterStatus]);

  // ── Filter ──
  const filtered = useMemo(() => {
    return users.filter((u) => {
      // @ts-ignore
      if (user && u.id === user.id) return false; // Don't show self
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? !u.banned : u.banned);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus, user]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);


  // ── Helpers ──
  const updateUser = async (userId: string, updates: Partial<User & { password?: string; roleIds?: string[] }>) => {
    // Update UI first (optimistic)
    const updated = users.map((u) => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updated);
    if (detailTarget?.id === userId) setDetailTarget((prev) => prev ? { ...prev, ...updates } : null);

    try {
      let res;
      if (updates.banned !== undefined) {
        // Use api utility for lock/unlock
        res = await api.post(`/auth/users/lockOrUnlock/${userId}`, {
          lockReason: updates.banReason
        });
      } else {
        // Use api utility for patch
        res = await api.patch(`/auth/users/${userId}`, updates);
      }

      if (res && res.success) {
        const u = res.user;
        if (u) {
          const mappedUser = {
            id: u.user_id || u._id || u.id,
            name: u.name || u.userName || u.username || "Người dùng",
            email: u.email,
            phone: u.phone,
            city: u.city,
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.username || u.userName || 'user')}`,
            joinedAt: u.created_at || u.createdAt || new Date().toISOString(),
            reportsCount: u.reportsCount || 0,
            resolvedCount: u.resolvedCount || 0,
            role: normalizeRole(u.role || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : "user")),
            roleId: u.roleId || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : undefined),
            banned: u.banned || (u.lockEnd && new Date(u.lockEnd) > new Date()),
            banReason: u.lockReason || u.banReason,
            managementScope: u.managementScope || [],
            password: "",
          };
          setUsers((prev) => prev.map((item) => (item.id === userId ? mappedUser : item)));
          if (detailTarget?.id === userId) setDetailTarget(mappedUser);
        }
      } else {
        toast.error(res?.message || "Cập nhật thất bại");
        // Revert UI on failure
        const apiUsers = await fetchUsersFromAPI();
        setUsers(apiUsers);
      }
    } catch (err) {
      console.error("updateUser API error:", err);
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleCreated = (newUser: User & { password: string }) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUnban = async (userId: string, name: string) => {
    updateUser(userId, { banned: false, banReason: undefined, banLevel: undefined, bannedAt: undefined, bannedUntil: undefined });
    try {
      await fetch(`${API_BASE}/auth/users/lockOrUnlock/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch { }
    toast.success(`🔓 Đã mở khóa tài khoản: ${name}`);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // 1. Thử pattern query param chuẩn (giống Role)
      let res = await api.delete(`/auth/users?id=${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      // 2. Thử pattern path param chuẩn (giống Permission)
      res = await api.delete(`/auth/users/${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      // 3. Thử pattern không có prefix /auth
      res = await api.delete(`/users/${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      // 4. Thử pattern có prefix /delete/ hoặc /remove/
      res = await api.delete(`/auth/users/delete/${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      res = await api.delete(`/auth/users/remove/${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      // 5. Thử pattern query param với key userId
      res = await api.delete(`/auth/users?userId=${userId}`);
      if (res.success) return handleDeletionSuccess(userId);

      toast.error(res.message || "Xóa tài khoản thất bại (Lỗi 404: Không tìm thấy endpoint xóa phù hợp)");
    } catch (err) {
      toast.error("Không thể kết nối đến máy chủ");
    }
  };

  const handleDeletionSuccess = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    if (detailTarget?.id === userId) setDetailTarget(null);
    toast.success("✅ Đã xóa tài khoản thành công");
  };

  // ── Stats ──
  const stats = useMemo(() => {
    if (!user) return { total: 0, admins: 0, moderators: 0, citizens: 0, active: 0, banned: 0 };
    return {
      total: users.filter((u) => u.id !== user.id).length,
      admins: users.filter((u) => u.role === "admin" && u.id !== user.id).length,
      moderators: users.filter((u) => u.role === "moderator").length,
      citizens: users.filter((u) => u.role === "user").length,
      active: users.filter((u) => !u.banned && u.id !== user.id).length,
      banned: users.filter((u) => u.banned).length,
    };
  }, [users, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user || !can("users_mgnt", "read")) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-8 mb-6">
          <PageTitle
            title={
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users size={18} className="text-white" />
                </div>
                <span className="text-2xl">Quản lý người dùng & Phân quyền</span>
              </div>
            }
            backTo=""
            subtitle="Tạo tài khoản cán bộ, phân quyền và kiểm soát truy cập"
            action={
              can("users_mgnt", "create") && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 text-sm"
                >
                  <Plus size={16} />
                  Tạo tài khoản mới
                </button>
              )
            }
          />
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6"
        >
          {isLoadingUsers ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                <Skeleton width="40px" height="24px" className="mx-auto mb-1.5" />
                <Skeleton width="60px" height="12px" className="mx-auto" />
              </div>
            ))
          ) : (
            [
              { id: "total", label: "Tổng", value: stats.total, color: "text-gray-800", bg: "bg-white", border: "border-gray-100" },
              { id: "admin", label: "Admin", value: stats.admins, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" },
              { id: "moderator", label: "Cán bộ", value: stats.moderators, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
              { id: "citizen", label: "Công dân", value: stats.citizens, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-100" },
              { id: "active", label: "Hoạt động", value: stats.active, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
              { id: "banned", label: "Đã khóa", value: stats.banned, color: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
            ].map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.04 }}
                className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center shadow-sm`}
              >
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role filter */}
            <div className="flex gap-2 flex-wrap">
              {([
                { val: "all", label: "Tất cả" },
                { val: "admin", label: "Admin" },
                { val: "moderator", label: "Cán bộ" },
                { val: "user", label: "Công dân" },
              ] as { val: FilterRole; label: string }[]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterRole(val)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterRole === val
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              {([
                { val: "all", label: "Mọi trạng thái" },
                { val: "active", label: "Hoạt động" },
                { val: "banned", label: "Đã khóa" },
              ] as { val: FilterStatus; label: string }[]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterStatus === val
                    ? val === "banned" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Result count ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{filtered.length}</span> người dùng
            {search && <span> · tìm kiếm "<strong>{search}</strong>"</span>}
          </p>
          <button
            onClick={loadUsers}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw size={12} /> Làm mới
          </button>
        </div>

        {/* ── User List ── */}
        {isLoadingUsers ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <Skeleton width="56px" height="56px" borderRadius="16px" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="150px" height="20px" />
                  <div className="flex gap-2">
                    <Skeleton width="80px" height="16px" borderRadius="12px" />
                    <Skeleton width="80px" height="16px" borderRadius="12px" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <SkeletonCircle size="32px" />
                  <SkeletonCircle size="32px" />
                  <SkeletonCircle size="32px" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Users size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Không tìm thấy người dùng</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo tài khoản mới</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Tạo tài khoản mới
            </button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-3">
            {paginatedUsers.map((u, i) => {
              const cfg = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;
              const RoleIcon = cfg.icon;
              return (
                <motion.div
                  key={u.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${u.banned ? "border-red-200 bg-red-50/30" : "border-gray-100"
                    }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow"
                        />
                        {u.banned && (
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                            <Ban size={11} className="text-white" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${cfg.dot}`}>
                          <RoleIcon size={9} className="text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h3 className="font-bold text-gray-900">{u.name}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <RoleBadge role={u.role} />
                              <StatusBadge banned={u.banned} />
                              {u.warnings && u.warnings.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  <Bell size={9} /> {u.warnings.length} cảnh báo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Mail size={11} className="text-gray-400" />{u.email}</span>
                          {u.phone && <span className="flex items-center gap-1"><Phone size={11} className="text-gray-400" />{u.phone}</span>}
                          {u.city && <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{u.city}</span>}
                          <span className="flex items-center gap-1"><FileText size={11} className="text-gray-400" />{u.reportsCount} báo cáo</span>
                          <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" />Tham gia {new Date(u.joinedAt).toLocaleDateString("vi-VN")}</span>
                        </div>

                        {u.role === "moderator" && u.managementScope && u.managementScope.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 items-center">
                            <span className="text-[11px] text-gray-400 mr-1">Lĩnh vực phụ trách:</span>
                            {u.managementScope.map((scopeVal) => (
                              <span key={scopeVal} className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium">
                                {CATEGORY_LABELS[scopeVal as keyof typeof CATEGORY_LABELS] || scopeVal}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Ban info */}
                        {u.banned && (
                          <div className="mt-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                            <ShieldAlert size={12} className="flex-shrink-0" />
                            <span><strong>{BAN_LEVELS[u.banLevel ?? "permanent"]?.label}</strong> · {u.banReason}</span>
                            {u.bannedUntil && u.bannedUntil !== "permanent" && (
                              <span className="text-red-500">· Hết hạn: {new Date(u.bannedUntil).toLocaleDateString("vi-VN")}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {/* View */}
                        <button
                          onClick={() => setDetailTarget(u)}
                          title="Xem chi tiết"
                          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Change Password */}
                        {can("users_mgnt", "update") && (
                          <button
                            onClick={() => setEditPasswordTarget(u)}
                            title="Đổi mật khẩu"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Key size={13} />
                            <span className="hidden sm:inline">Đổi MK</span>
                          </button>
                        )}

                        {/* Change Role */}
                        {can("users_mgnt", "assign") && (
                          <button
                            onClick={() => setChangeRoleTarget(u)}
                            title="Phân quyền"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <UserCog size={13} />
                            <span className="hidden sm:inline">Phân quyền</span>
                          </button>
                        )}

                        {/* Lock / Unlock */}
                        {can("users_mgnt", "update") && (
                          u.banned ? (
                            <button
                              onClick={() => handleUnban(u.id, u.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <Unlock size={13} />
                              <span className="hidden sm:inline">Mở khóa</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanTarget(u)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <LockKeyhole size={13} />
                              <span className="hidden sm:inline">Khóa</span>
                            </button>
                          )
                        )}

                        {/* Delete Account */}
                        {can("users_mgnt", "delete") && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Xóa tài khoản"
                            className="p-2 hover:bg-red-100 rounded-xl text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Pagination Controls ── */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-gray-500">
                Hiển thị <span className="font-semibold text-gray-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}</span> - <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> trong tổng số <span className="font-semibold text-gray-800">{filtered.length}</span> người dùng
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Previous Page Button */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Trở trước
                </button>
                
                {/* Numbered Page Buttons (intelligently limited) */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Only show current page, first, last, and 1 page before/after
                  if (totalPages > 5 && pNum !== 1 && pNum !== totalPages && Math.abs(currentPage - pNum) > 1) {
                    if (pNum === 2 && currentPage > 3) {
                      return <span key="dots-start" className="px-1 text-gray-400 text-xs select-none">...</span>;
                    }
                    if (pNum === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key="dots-end" className="px-1 text-gray-400 text-xs select-none">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === pNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                
                {/* Next Page Button */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateAccountModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
        {changeRoleTarget && (
          <ChangeRoleModal
            target={changeRoleTarget}
            currentAdminId={user.id}
            onClose={() => setChangeRoleTarget(null)}
            onSaved={(newRoleId, newScope) => {
              updateUser(changeRoleTarget.id, { roleIds: [newRoleId], managementScope: newScope });
            }}
          />
        )}
        {banTarget && (
          <BanModal
            target={banTarget}
            onClose={() => setBanTarget(null)}
            onBanned={(updates) => updateUser(banTarget.id, updates)}
          />
        )}
        {editPasswordTarget && (
          <EditPasswordModal
            target={editPasswordTarget}
            onClose={() => setEditPasswordTarget(null)}
            onSaved={(newPassword) => {
              updateUser(editPasswordTarget.id, { password: newPassword });
            }}
          />
        )}
        {deleteTarget && (
          <DeleteAccountModal
            target={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => handleDeleteUser(deleteTarget.id)}
          />
        )}
        {detailTarget && (
          <UserDetailDrawer
            target={detailTarget}
            onClose={() => setDetailTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}