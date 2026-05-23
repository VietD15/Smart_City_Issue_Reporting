import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Search,
  Filter,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  Calendar,
  MapPin,
  User,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Info,
  Users,
  ArrowRight,
  BarChart3,
  Shield,
  UserCog,
  Loader2,
} from "lucide-react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { PageTitle } from "../components/PageTitle";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/ui/skeleton";
import { Card } from "../components/ui/card";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS, IssueStatus } from "../data/issues";
import { useIssues } from "../context/IssuesContext";
import { toast } from "sonner";

const STATUS_ICONS = {
  pending: Clock,
  received: Clock,
  processing: Loader2,
  need_info: Clock,
  resolved: CheckCircle2,
  rejected: XCircle,
};

const SEVERITY_COLORS = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const SEVERITY_LABELS = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

export function AdminManagementPage() {
  const { user, isLoading, can } = useAuth();
  const { issues, updateIssue, refreshIssues } = useIssues();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [aiFilter, setAiFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    refreshIssues();
  }, [refreshIssues]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-3">
              <Skeleton width="300px" height="32px" />
              <Skeleton width="450px" height="16px" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 border-0 shadow-sm bg-white">
                <div className="flex items-center gap-4">
                  <SkeletonCircle size="40px" />
                  <div className="space-y-2">
                    <Skeleton width="100px" height="20px" />
                    <Skeleton width="60px" height="12px" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-0 shadow-sm bg-white overflow-hidden">
            <div className="flex gap-4 mb-8">
              <Skeleton width="300px" height="40px" borderRadius="10px" />
              <div className="flex gap-2">
                <Skeleton width="100px" height="40px" borderRadius="10px" />
                <Skeleton width="100px" height="40px" borderRadius="10px" />
              </div>
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 py-4 border-b border-gray-50">
                  <Skeleton width="120px" height="16px" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height="16px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                  <Skeleton width="100px" height="24px" borderRadius="20px" />
                  <Skeleton width="120px" height="16px" />
                  <SkeletonCircle size="32px" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!can("issues_mgnt", "read")) {
    return <Navigate to="/" replace />;
  }

  const visibleIssues = issues.filter((i) => {
    if (user && (user.role === "moderator" || user.role === "cán bộ" || user.role === "Cán bộ")) {
      const scope = user.managementScope || [];
      const matchesScope = scope.includes(i.category);
      if (!matchesScope) return false;
      if (user.city) {
        return i.city && i.city.toLowerCase().trim() === user.city.toLowerCase().trim();
      }
      return true;
    }
    return true;
  });

  const filteredIssues = visibleIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.issueCode && issue.issueCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesAi = aiFilter === "all" || (aiFilter === "verified" ? issue.aiVerified : !issue.aiVerified);
    return matchesSearch && matchesStatus && matchesAi;
  });

  const stats = [
    {
      label: "Tổng báo cáo",
      value: visibleIssues.length,
      icon: AlertCircle,
      color: "bg-blue-500",
    },
    {
      label: "Chờ xử lý",
      value: visibleIssues.filter((i) => i.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      label: "Đang xử lý",
      value: visibleIssues.filter((i) => i.status === "processing").length,
      icon: Loader2,
      color: "bg-orange-500",
    },
    {
      label: "Đã giải quyết",
      value: visibleIssues.filter((i) => i.status === "resolved").length,
      icon: CheckCircle2,
      color: "bg-green-500",
    },
  ];

  const handleUpdateStatus = (issueId: string, newStatus: IssueStatus) => {
    updateIssue(issueId, { status: newStatus });
    toast.success(`Đã cập nhật trạng thái thành "${STATUS_LABELS[newStatus]}"`);
    setShowStatusModal(false);
    setSelectedIssue(null);
  };

  const StatusUpdateModal = ({ issueId }: { issueId: string }) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return null;

    const statusOptions: IssueStatus[] = ["pending", "processing", "resolved", "rejected"];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => {
          setShowStatusModal(false);
          setSelectedIssue(null);
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold text-gray-900 text-lg mb-4">Cập nhật trạng thái</h3>
          <p className="text-gray-600 text-sm mb-4">
            Báo cáo: <span className="font-semibold">{issue.title}</span>
          </p>
          <div className="space-y-2">
            {statusOptions.map((status) => {
              const Icon = STATUS_ICONS[status];
              return (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(issueId, status)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    issue.status === status
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  >
                    <Icon size={18} className={status === "processing" ? "animate-spin" : ""} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">{STATUS_LABELS[status]}</p>
                    <p className="text-xs text-gray-500">
                      {status === "pending" && "Báo cáo chưa được xử lý"}
                      {status === "processing" && "Đang trong quá trình xử lý"}
                      {status === "resolved" && "Đã hoàn thành xử lý"}
                      {status === "rejected" && "Báo cáo không hợp lệ"}
                    </p>
                  </div>
                  {issue.status === status && (
                    <CheckCircle2 size={20} className="text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const AiAnalysisModal = ({ issueId }: { issueId: string }) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue || !issue.aiAnalysis) return null;

    const { aiAnalysis } = issue;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowAiAnalysis(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-xl mb-1">Phân tích AI</h3>
              <p className="text-gray-600 text-sm">{issue.title}</p>
            </div>
          </div>

          {/* Score */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 mb-6 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Độ tin cậy</span>
              <span className="text-3xl font-black text-purple-600">{aiAnalysis.confidenceScore}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aiAnalysis.confidenceScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className={aiAnalysis.isAuthentic ? "text-green-500" : "text-red-500"} />
                <span className="text-sm font-semibold text-gray-700">Tính xác thực</span>
              </div>
              <p className={`text-lg font-bold ${aiAnalysis.isAuthentic ? "text-green-600" : "text-red-600"}`}>
                {aiAnalysis.isAuthentic ? "Đã xác thực" : "Cần xác minh"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} style={{ color: SEVERITY_COLORS[aiAnalysis.severity] }} />
                <span className="text-sm font-semibold text-gray-700">Mức độ nghiêm trọng</span>
              </div>
              <p className="text-lg font-bold" style={{ color: SEVERITY_COLORS[aiAnalysis.severity] }}>
                {SEVERITY_LABELS[aiAnalysis.severity]}
              </p>
            </div>
          </div>

          {/* Reasons */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              Lý do phân tích
            </h4>
            <ul className="space-y-2">
              {aiAnalysis.reasons.map((reason, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Thẻ phân loại</h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                <Settings size={24} />
              </div>
              <div>
                <h1 className="font-black text-gray-900 text-3xl">Quản lý báo cáo</h1>
                <p className="text-gray-500">Xem và cập nhật trạng thái các báo cáo</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Buttons removed as per user request */}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Recommended Issues */}
        {issues.filter(i => i.aiVerified && (i.aiAnalysis?.severity === "high" || i.aiAnalysis?.severity === "critical")).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="font-black text-xl">Đề xuất từ AI</h2>
                <p className="text-purple-100 text-sm">Các báo cáo được xác thực và cần ưu tiên xử lý</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues
                .filter(i => i.aiVerified && (i.aiAnalysis?.severity === "high" || i.aiAnalysis?.severity === "critical"))
                .slice(0, 3)
                .map((issue, index) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer border border-white/20"
                    onClick={() => setShowAiAnalysis(issue.id)}
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={issue.imageUrl}
                        alt={issue.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white line-clamp-2 mb-1">{issue.title}</p>
                        <p className="text-purple-100 text-xs flex items-center gap-1">
                          <MapPin size={12} />
                          {issue.district}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <ShieldCheck size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-purple-100">Độ tin cậy AI</p>
                          <p className="font-black text-white">{issue.aiScore}%</p>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                        <p className="text-xs font-bold">{SEVERITY_LABELS[issue.aiAnalysis!.severity]}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, địa điểm, người báo cáo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IssueStatus | "all")}
                className="pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Từ chối</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* AI Filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={aiFilter}
                onChange={(e) => setAiFilter(e.target.value as "all" | "verified" | "unverified")}
                className="pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">Tất cả AI</option>
                <option value="verified">Đã xác thực</option>
                <option value="unverified">Chưa xác thực</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Mã số
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Vấn đề
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Người báo cáo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ngày báo cáo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <AlertCircle size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Không tìm thấy báo cáo nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue, index) => {
                    const StatusIcon = STATUS_ICONS[issue.status];
                    return (
                      <motion.tr
                        key={issue.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            #VN{issue.issueCode ? issue.issueCode.replace("#VN", "").slice(-3) : issue.id.slice(-3).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={issue.imageUrl}
                              alt={issue.title}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">
                                {issue.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1.5 text-sm text-gray-600">
                            <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{issue.district}, {issue.city}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <User size={14} className="text-gray-400" />
                            {issue.reporterName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(issue.reportedAt).toLocaleDateString("vi-VN")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: STATUS_COLORS[issue.status] }}
                          >
                            <StatusIcon size={12} className={issue.status === "processing" ? "animate-spin" : ""} />
                            {STATUS_LABELS[issue.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/issues/${issue.id}`}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </Link>
                            {can("issues_mgnt", "update") && (
                              <button
                                onClick={() => {
                                  setSelectedIssue(issue.id);
                                  setShowStatusModal(true);
                                }}
                                className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
                                title="Cập nhật trạng thái"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            {issue.aiAnalysis && (
                              <button
                                onClick={() => setShowAiAnalysis(issue.id)}
                                className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                                title="Xem phân tích AI"
                              >
                                <Sparkles size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Hiển thị {filteredIssues.length} / {issues.length} báo cáo
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedIssue && <StatusUpdateModal issueId={selectedIssue} />}
      {showAiAnalysis && <AiAnalysisModal issueId={showAiAnalysis} />}
    </div>
  );
}