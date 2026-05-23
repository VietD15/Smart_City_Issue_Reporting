import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  Search, Filter, X, CheckCircle2, Clock, Loader2,
  MapPin, Calendar, Eye, ClipboardList, UserCheck,
  Zap, Info, CheckSquare, XCircle, ArrowRight, User, FileText,
  RefreshCw, Plus,
  Trash2, Shield, Inbox, Star, Flag,
} from "lucide-react";
import { useIssues } from "../context/IssuesContext";
import { useAuth } from "../context/AuthContext";
import {
  Issue, IssueStatus, IssueCategory,
  CATEGORY_LABELS, CATEGORY_COLORS,
  STATUS_LABELS, STATUS_COLORS,
  ProcessingStep,
} from "../data/issues";
import { PageTitle } from "../components/PageTitle";
import { toast } from "sonner";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/ui/skeleton";
import { Card } from "../components/ui/card";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const SEVERITY_LABELS: Record<string, string> = {
  low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Khẩn cấp",
};
const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatDateShort = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ────────────────────────────────────────────────────────────────────────────
// Status Step Config
// ────────────────────────────────────────────────────────────────────────────
const STEP_ICONS: Record<string, React.ElementType> = {
  received: CheckCircle2,
  assigned: UserCheck,
  processing: Loader2,
  need_info: Info,
  resolved: CheckSquare,
  rejected: XCircle,
};

const STEP_COLORS: Record<string, string> = {
  received: "text-indigo-500 bg-indigo-50 border-indigo-200",
  assigned: "text-blue-500 bg-blue-50 border-blue-200",
  processing: "text-blue-600 bg-blue-50 border-blue-200",
  need_info: "text-orange-500 bg-orange-50 border-orange-200",
  resolved: "text-emerald-500 bg-emerald-50 border-emerald-200",
  rejected: "text-red-500 bg-red-50 border-red-200",
};

const STEP_LABELS: Record<string, string> = {
  received: "Đã tiếp nhận",
  assigned: "Phân công xử lý",
  processing: "Đang xử lý",
  need_info: "Yêu cầu bổ sung",
  resolved: "Hoàn thành",
  rejected: "Từ chối",
};

// ────────────────────────────────────────────────────────────────────────────
// Issue Row Card
// ────────────────────────────────────────────────────────────────────────────
function IssueRowCard({
  issue,
  onClick,
  index,
}: {
  issue: Issue;
  onClick: () => void;
  index: number;
}) {
  const severity = issue.aiAnalysis?.severity ?? "medium";
  const statusColor = STATUS_COLORS[issue.status] ?? "#6b7280";

  // Calculate rating stats
  const verifications = issue.verifications ?? [];
  const totalRatings = verifications.length;
  const avgRating = totalRatings > 0
    ? verifications.reduce((sum, v) => sum + v.rating, 0) / totalRatings
    : 0;

  // Spam reports
  const spamReports = issue.spamReports ?? [];
  const totalSpam = spamReports.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="w-24 sm:w-32 flex-shrink-0 relative overflow-hidden">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[severity]}`}
                >
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {issue.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} /> {issue.location}, {issue.district}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} /> {formatDateShort(issue.reportedAt)}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <User size={11} /> {issue.reporterName}
                </span>
              </div>
              
              {/* Rating and Spam Reports Row */}
              {(totalRatings > 0 || totalSpam > 0) && (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {totalRatings > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)} ({totalRatings} đánh giá)
                    </span>
                  )}
                  {totalSpam > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium" title={spamReports.map(r => r.userName).join(", ")}>
                      <Flag size={11} className="text-red-500" />
                      {totalSpam} báo sai ({spamReports.map(r => r.userName).join(", ")})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status + Arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="hidden sm:block px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: statusColor }}
              >
                {STATUS_LABELS[issue.status]}
              </span>
              {issue.assignedTo && (
                <span className="hidden md:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  <UserCheck size={11} className="text-blue-400" />
                  {issue.assignedTo}
                </span>
              )}
              <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Mobile status */}
          <div className="sm:hidden mt-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: statusColor }}
            >
              {STATUS_LABELS[issue.status]}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Processing Timeline
// ────────────────────────────────────────────────────────────────────────────
function ProcessingTimeline({ steps }: { steps: ProcessingStep[] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
        Chưa có bước xử lý nào
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.action] ?? CheckCircle2;
        const colorClass = STEP_COLORS[step.action] ?? "text-gray-500 bg-gray-50 border-gray-200";
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon size={14} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
            </div>
            {/* Content */}
            <div className={`pb-4 min-w-0 flex-1 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-800">
                  {STEP_LABELS[step.action] ?? step.action}
                </span>
                {step.assignedTo && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    → {step.assignedTo}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{step.note}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={10} /> {step.actorName}
                <span>·</span>
                <Clock size={10} /> {formatDate(step.createdAt)}
              </div>
              {step.evidence && step.evidence.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {step.evidence.map((url, j) => (
                    <img
                      key={j}
                      src={url}
                      alt="Minh chứng"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Action Panel (main processing buttons and forms)
// ────────────────────────────────────────────────────────────────────────────
type ActionType = "receive" | "assign" | "processing" | "need_info" | "complete" | "reject" | null;

function ActionPanel({ issue, userId, userName }: { issue: Issue; userId: string; userName: string }) {
  const { receiveIssue, assignIssue, startProcessing, requestAdditionalInfo, completeIssue, rejectIssue } = useIssues();
  const { can } = useAuth();
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [assignedTo, setAssignedTo] = useState(issue.assignedTo ?? "");
  const [processingNote, setProcessingNote] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);
  const [rejectNote, setRejectNote] = useState("");
  const [loading, setLoading] = useState(false);

  const status = issue.status;

  const canReceive = status === "pending";
  const canAssign = status === "received" || status === "processing" || status === "need_info";
  const canProcess = status === "received" || status === "need_info";
  const canNeedInfo = status === "received" || status === "processing";
  const canComplete = status === "processing";
  const canReject = status === "pending" || status === "received";

  const runAction = async (fn: () => Promise<any>) => {
    setLoading(true);
    // Keep the small delay for better UX (showing loading state)
    await new Promise((r) => setTimeout(r, 600));
    await fn();
    setLoading(false);
    setActiveAction(null);
  };

  const handleReceive = () => runAction(async () => {
    const success = await receiveIssue(issue.id, userId, userName);
    if (success) toast.success("✅ Đã tiếp nhận báo cáo thành công!");
  });
  
  const handleAssign = () => {
    if (!assignedTo.trim()) { toast.error("Vui lòng nhập tên người/đội phụ trách"); return; }
    runAction(async () => {
      const success = await assignIssue(issue.id, assignedTo.trim(), userId, userName);
      if (success) toast.success(`👤 Đã phân công cho: ${assignedTo}`);
    });
  };
  
  const handleProcessing = () => {
    if (!processingNote.trim()) { toast.error("Vui lòng nhập ghi chú cập nhật tiến độ"); return; }
    runAction(async () => {
      const success = await startProcessing(issue.id, processingNote.trim(), userId, userName);
      if (success) toast.success("🔄 Đã cập nhật trạng thái Đang xử lý!");
    });
  };
  
  const handleNeedInfo = () => {
    if (!infoRequest.trim()) { toast.error("Vui lòng nhập nội dung yêu cầu bổ sung"); return; }
    runAction(async () => {
      const success = await requestAdditionalInfo(issue.id, infoRequest.trim(), userId, userName);
      if (success) toast.success("ℹ️ Đã gửi yêu cầu bổ sung thông tin!");
    });
  };
  
  const handleComplete = () => {
    if (!completionNote.trim()) { toast.error("Vui lòng nhập kết quả xử lý"); return; }
    const validEvidence = evidenceUrls.filter((u) => u.trim());
    runAction(async () => {
      const success = await completeIssue(issue.id, completionNote.trim(), validEvidence, userId, userName);
      if (success) toast.success("🎉 Báo cáo đã được đánh dấu Hoàn thành!");
    });
  };
  
  const handleReject = () => {
    if (!rejectNote.trim()) { toast.error("Vui lòng nhập lý do từ chối"); return; }
    runAction(async () => {
      const success = await rejectIssue(issue.id, rejectNote.trim(), userId, userName);
      if (success) toast.success("Đã từ chối báo cáo");
    });
  };

  if (status === "resolved" || status === "rejected") {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center text-sm text-gray-400">
        {status === "resolved"
          ? <><CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1" /> Báo cáo đã hoàn thành xử lý</>
          : <><XCircle size={20} className="mx-auto text-red-400 mb-1" /> Báo cáo đã bị từ chối</>
        }
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {canReceive && can("issues_process", "update") && (
          <button
            onClick={() => setActiveAction("receive")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "receive"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <Inbox size={15} /> Tiếp nhận
          </button>
        )}
        {canAssign && can("issues_process", "assign") && (
          <button
            onClick={() => setActiveAction("assign")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "assign"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <UserCheck size={15} /> Phân công
          </button>
        )}
        {canProcess && can("issues_process", "update") && (
          <button
            onClick={() => setActiveAction("processing")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "processing"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            }`}
          >
            <RefreshCw size={15} /> Cập nhật tiến độ
          </button>
        )}
        {canNeedInfo && can("issues_process", "update") && (
          <button
            onClick={() => setActiveAction("need_info")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "need_info"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            <Info size={15} /> Yêu cầu bổ sung
          </button>
        )}
        {canComplete && can("issues_process", "approve") && (
          <button
            onClick={() => setActiveAction("complete")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "complete"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <CheckSquare size={15} /> Hoàn thành
          </button>
        )}
        {canReject && can("issues_process", "update") && (
          <button
            onClick={() => setActiveAction("reject")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeAction === "reject"
                ? "bg-red-600 text-white shadow-lg shadow-red-200"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            <XCircle size={15} /> Từ chối
          </button>
        )}
      </div>

      {/* Sub-forms */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            key={activeAction}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">

              {/* RECEIVE */}
              {activeAction === "receive" && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Xác nhận tiếp nhận báo cáo</p>
                  <p className="text-xs text-gray-500">
                    Bạn đang tiếp nhận báo cáo này. Trạng thái sẽ chuyển từ <strong>Chờ xử lý</strong> → <strong>Đã tiếp nhận</strong>.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleReceive}
                      disabled={loading}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Xác nhận tiếp nhận
                    </button>
                  </div>
                </>
              )}

              {/* ASSIGN */}
              {activeAction === "assign" && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Phân công người/đội xử lý</p>
                  <input
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Nhập tên người hoặc đội phụ trách..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleAssign}
                      disabled={loading}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                      Phân công
                    </button>
                  </div>
                </>
              )}

              {/* PROCESSING */}
              {activeAction === "processing" && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Cập nhật tiến độ xử lý</p>
                  <p className="text-xs text-gray-500">Trạng thái sẽ chuyển sang <strong>Đang xử lý</strong>.</p>
                  <textarea
                    value={processingNote}
                    onChange={(e) => setProcessingNote(e.target.value)}
                    placeholder="Mô tả tiến độ xử lý hiện tại..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleProcessing}
                      disabled={loading}
                      className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Cập nhật
                    </button>
                  </div>
                </>
              )}

              {/* NEED INFO */}
              {activeAction === "need_info" && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Yêu cầu bổ sung thông tin</p>
                  <p className="text-xs text-gray-500">Trạng thái sẽ chuyển sang <strong>Cần bổ sung</strong>. Người báo cáo sẽ nhận thông báo.</p>
                  <textarea
                    value={infoRequest}
                    onChange={(e) => setInfoRequest(e.target.value)}
                    placeholder="Nêu rõ thông tin còn thiếu cần người báo cáo bổ sung..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleNeedInfo}
                      disabled={loading}
                      className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Info size={14} />}
                      Gửi yêu cầu
                    </button>
                  </div>
                </>
              )}

              {/* COMPLETE */}
              {activeAction === "complete" && (
                <>
                  <p className="text-sm font-semibold text-gray-700">Ghi nhận kết quả & hoàn thành</p>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Mô tả kết quả xử lý, giải pháp đã thực hiện..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white resize-none"
                  />
                  {/* Evidence URLs */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Hình ảnh minh chứng (URL) — tùy chọn</p>
                    {evidenceUrls.map((url, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          value={url}
                          onChange={(e) => {
                            const updated = [...evidenceUrls];
                            updated[i] = e.target.value;
                            setEvidenceUrls(updated);
                          }}
                          placeholder={`URL hình ảnh ${i + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                        />
                        {evidenceUrls.length > 1 && (
                          <button
                            onClick={() => setEvidenceUrls(evidenceUrls.filter((_, j) => j !== i))}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {evidenceUrls.length < 4 && (
                      <button
                        onClick={() => setEvidenceUrls([...evidenceUrls, ""])}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        <Plus size={12} /> Thêm ảnh
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                      Hoàn thành
                    </button>
                  </div>
                </>
              )}

              {/* REJECT */}
              {activeAction === "reject" && (
                <>
                  <p className="text-sm font-semibold text-red-700">⚠️ Từ chối báo cáo</p>
                  <p className="text-xs text-gray-500">Vui lòng nêu rõ lý do từ chối để người dân hiểu.</p>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Lý do từ chối báo cáo này..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setActiveAction(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">Hủy</button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Xác nhận từ chối
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Detail Modal
// ────────────────────────────────────────────────────────────────────────────
function IssueDetailModal({
  issue,
  onClose,
  userId,
  userName,
}: {
  issue: Issue;
  onClose: () => void;
  userId: string;
  userName: string;
}) {
  const [tab, setTab] = useState<"info" | "process" | "history">("info");
  const { issues } = useIssues();
  // Always get the latest version of the issue from the store
  const liveIssue = issues.find((i) => i.id === issue.id) ?? issue;

  const severity = liveIssue.aiAnalysis?.severity ?? "medium";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="relative">
            <img
              src={liveIssue.imageUrl}
              alt={liveIssue.title}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-4 left-4 right-12">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full text-white text-xs font-medium"
                  style={{ backgroundColor: CATEGORY_COLORS[liveIssue.category] }}
                >
                  {CATEGORY_LABELS[liveIssue.category]}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: STATUS_COLORS[liveIssue.status] }}
                >
                  {STATUS_LABELS[liveIssue.status]}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${SEVERITY_COLORS[severity]}`}>
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>
              <h2 className="text-white font-bold leading-tight line-clamp-2">
                {liveIssue.title}
              </h2>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            {[
              { id: "info", label: "Thông tin", icon: FileText },
              { id: "process", label: "Xử lý", icon: Zap },
              { id: "history", label: "Lịch sử", icon: ClipboardList },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === id
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === id && (
                  <motion.div
                    layoutId="modal-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                  />
                )}
                <Icon size={14} />
                {label}
                {id === "history" && liveIssue.processingHistory && liveIssue.processingHistory.length > 0 && (
                  <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
                    {liveIssue.processingHistory.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* INFO TAB */}
            {tab === "info" && (
              <div className="space-y-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Mã báo cáo</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <FileText size={12} className="text-gray-400" /> #{liveIssue.issueCode || liveIssue.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Người báo cáo</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <User size={12} className="text-gray-400" /> {liveIssue.reporterName}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Ngày báo cáo</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" /> {formatDateShort(liveIssue.reportedAt)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Địa điểm</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <MapPin size={12} className="text-red-400" /> {liveIssue.location}, {liveIssue.district}, {liveIssue.city}
                    </p>
                  </div>
                  {liveIssue.assignedTo && (
                    <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-blue-400 mb-0.5">Người/Đội phụ trách</p>
                      <p className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                        <UserCheck size={12} /> {liveIssue.assignedTo}
                        {liveIssue.assignedAt && <span className="text-blue-400 font-normal">· {formatDate(liveIssue.assignedAt)}</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium">Mô tả vấn đề</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">
                    {liveIssue.description}
                  </p>
                </div>

                {/* AI Analysis */}
                {liveIssue.aiAnalysis && (
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-violet-500" />
                      <span className="text-sm font-semibold text-violet-700">Phân tích AI</span>
                      <span className="text-xs text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">
                        {liveIssue.aiAnalysis.confidenceScore}% tin cậy
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {liveIssue.aiAnalysis.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-violet-700">
                          <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0 text-violet-400" /> {r}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {liveIssue.aiAnalysis.tags.map((tag, i) => (
                        <span key={i} className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional info request */}
                {liveIssue.additionalInfoRequest && (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-600 mb-1">📋 Yêu cầu bổ sung thông tin</p>
                    <p className="text-sm text-orange-700">{liveIssue.additionalInfoRequest}</p>
                  </div>
                )}

                {/* Completion note */}
                {liveIssue.completionNote && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">✅ Kết quả xử lý</p>
                    <p className="text-sm text-emerald-700">{liveIssue.completionNote}</p>
                    {liveIssue.completionEvidence && liveIssue.completionEvidence.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {liveIssue.completionEvidence.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Minh chứng"
                            className="w-20 h-20 rounded-lg object-cover border border-emerald-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* View on public page */}
                <Link
                  to={`/issues/${liveIssue.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <Eye size={14} /> Xem trang chi tiết công khai
                </Link>
              </div>
            )}

            {/* PROCESS TAB */}
            {tab === "process" && (
              <div className="space-y-4">
                {/* Current status overview */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Trạng thái hiện tại</p>
                    <span
                      className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                      style={{ backgroundColor: STATUS_COLORS[liveIssue.status] }}
                    >
                      {STATUS_LABELS[liveIssue.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Cập nhật lần cuối</p>
                    <p className="text-xs text-gray-600">{formatDate(liveIssue.updatedAt)}</p>
                  </div>
                </div>

                {/* Action Panel */}
                <ActionPanel issue={liveIssue} userId={userId} userName={userName} />
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === "history" && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Nhật ký xử lý</p>
                <ProcessingTimeline steps={liveIssue.processingHistory ?? []} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
const ALL_STATUSES: IssueStatus[] = ["pending", "received", "processing", "need_info", "resolved", "rejected"];
const ALL_CATEGORIES: IssueCategory[] = ["road", "garbage", "lighting", "flood", "noise", "other"];

export function ModeratorIssuesPage() {
  const { user, isLoading, can } = useAuth();
  const { issues } = useIssues();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <Skeleton width="250px" height="32px" />
              <Skeleton width="400px" height="16px" />
            </div>
            <Skeleton width="150px" height="44px" borderRadius="12px" />
          </div>

          <Card className="p-6 border-0 shadow-sm bg-white overflow-hidden">
            <div className="flex gap-4 mb-6">
              <Skeleton width="300px" height="40px" borderRadius="10px" />
              <Skeleton width="120px" height="40px" borderRadius="10px" />
              <Skeleton width="120px" height="40px" borderRadius="10px" />
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
                  <Skeleton width="60px" height="24px" />
                  <div className="flex-1 flex items-center gap-3">
                    <SkeletonCircle size="40px" />
                    <div className="space-y-2 flex-1">
                      <Skeleton width="200px" height="16px" />
                      <Skeleton width="150px" height="12px" />
                    </div>
                  </div>
                  <Skeleton width="100px" height="24px" borderRadius="8px" />
                  <Skeleton width="80px" height="16px" />
                  <Skeleton width="100px" height="24px" borderRadius="20px" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Access control is deferred until after all hooks are declared to comply with React Rules of Hooks

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<IssueCategory | "all">("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterAssigned, setFilterAssigned] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<"date" | "severity" | "status" | "rating">("rating");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { refreshIssues } = useIssues();

  useEffect(() => {
    refreshIssues();
  }, [refreshIssues]);

  const visibleIssues = useMemo(() => {
    if (user && (user.role === "moderator" || user.role === "cán bộ" || user.role === "Cán bộ")) {
      const scope = user.managementScope || [];
      return issues.filter((i) => scope.includes(i.category));
    }
    return issues;
  }, [issues, user]);

  const filtered = useMemo(() => {
    let list = [...visibleIssues];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.district.toLowerCase().includes(q) ||
          i.reporterName.toLowerCase().includes(q) ||
          (i.issueCode && i.issueCode.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    if (filterSeverity !== "all") list = list.filter((i) => i.aiAnalysis?.severity === filterSeverity);
    if (filterAssigned === "mine") list = list.filter((i) => i.moderatorId === user?.id);

    // Sort
    list.sort((a, b) => {
      if (sortBy === "date") return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      if (sortBy === "severity") {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[b.aiAnalysis?.severity ?? "low"] ?? 0) - (order[a.aiAnalysis?.severity ?? "low"] ?? 0);
      }
      if (sortBy === "status") {
        const order: Record<IssueStatus, number> = { pending: 6, received: 5, processing: 4, need_info: 3, resolved: 2, rejected: 1 };
        return (order[b.status] ?? 0) - (order[a.status] ?? 0);
      }
      if (sortBy === "rating") {
        const getAvg = (issue: Issue) => {
          const vs = issue.verifications || [];
          if (vs.length === 0) return 0;
          return vs.reduce((sum, v) => sum + v.rating, 0) / vs.length;
        };
        return getAvg(b) - getAvg(a);
      }
      return 0;
    });

    return list;
  }, [visibleIssues, search, filterStatus, filterCategory, filterSeverity, filterAssigned, sortBy, user?.id]);

  // Stats
  const stats = useMemo(() => ({
    total: visibleIssues.length,
    pending: visibleIssues.filter((i) => i.status === "pending").length,
    received: visibleIssues.filter((i) => i.status === "received").length,
    processing: visibleIssues.filter((i) => i.status === "processing").length,
    need_info: visibleIssues.filter((i) => i.status === "need_info").length,
    resolved: visibleIssues.filter((i) => i.status === "resolved").length,
    mine: visibleIssues.filter((i) => i.moderatorId === user?.id).length,
  }), [visibleIssues, user?.id]);

  const activeFilterCount = [
    filterStatus !== "all",
    filterCategory !== "all",
    filterSeverity !== "all",
    filterAssigned !== "all",
  ].filter(Boolean).length;

  // Access control - MOVE AFTER ALL HOOKS
  const hasAccess = user && user.role !== "admin" && (
    user.role === "moderator" || 
    user.role === "Cán bộ" || 
    user.role === "cán bộ" || 
    user.role === "Quản trị viên" || 
    can("issues", "read")
  );

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 flex flex-col items-center justify-center text-gray-400">
        <Shield size={48} className="mb-4 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
        <p className="text-gray-500">Bạn không có quyền quản lý báo cáo.</p>
        <Link to="/" className="mt-4 text-indigo-600 hover:underline text-sm font-medium">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 mb-6"
        >
          <PageTitle
            title={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <span className="text-2xl">Quản lý & Xử lý báo cáo</span>
              </div>
            }
            backTo=""
            subtitle="Hệ thống quản lý quy trình xử lý báo cáo từ người dân"
            action={
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm">
                  👮 {user.name}
                </span>
              </div>
            }
          />
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6"
        >
          {[
            { label: "Tất cả", value: stats.total, color: "text-gray-700", bg: "bg-white", border: "border-gray-100", dot: "bg-gray-400", action: () => { setFilterStatus("all"); setFilterAssigned("all"); } },
            { label: "Chờ xử lý", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400", action: () => { setFilterStatus("pending"); setFilterAssigned("all"); } },
            { label: "Đã tiếp nhận", value: stats.received, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100", dot: "bg-indigo-400", action: () => { setFilterStatus("received"); setFilterAssigned("all"); } },
            { label: "Đang xử lý", value: stats.processing, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-400", action: () => { setFilterStatus("processing"); setFilterAssigned("all"); } },
            { label: "Cần bổ sung", value: stats.need_info, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-400", action: () => { setFilterStatus("need_info"); setFilterAssigned("all"); } },
            { label: "Hoàn thành", value: stats.resolved, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-400", action: () => { setFilterStatus("resolved"); setFilterAssigned("all"); } },
            { label: "Của tôi", value: stats.mine, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-100", dot: "bg-violet-400", action: () => { setFilterAssigned("mine"); setFilterStatus("all"); } },
          ].map((s, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={s.action}
              className={`${s.bg} ${s.border} border rounded-2xl p-3 text-center cursor-pointer hover:shadow-md transition-all duration-200 col-span-1`}
            >
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Search + Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5"
        >
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, địa điểm, người báo cáo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50 cursor-pointer"
            >
              <option value="rating">Đánh giá cao nhất</option>
              <option value="date">Mới nhất</option>
              <option value="severity">Mức độ</option>
              <option value="status">Trạng thái</option>
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter size={15} />
              Lọc
              {activeFilterCount > 0 && (
                <span className="bg-white text-indigo-700 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trạng thái</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">Tất cả</option>
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Danh mục</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">Tất cả</option>
                      {ALL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mức độ</label>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">Tất cả</option>
                      <option value="critical">Khẩn cấp</option>
                      <option value="high">Cao</option>
                      <option value="medium">Trung bình</option>
                      <option value="low">Thấp</option>
                    </select>
                  </div>

                  {/* Assignment */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phân công</label>
                    <select
                      value={filterAssigned}
                      onChange={(e) => setFilterAssigned(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">Tất cả báo cáo</option>
                      <option value="mine">Báo cáo của tôi</option>
                    </select>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterCategory("all");
                      setFilterSeverity("all");
                      setFilterAssigned("all");
                    }}
                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <X size={12} /> Xoá toàn bộ bộ lọc
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            Tìm thấy <span className="font-semibold text-gray-800">{filtered.length}</span> báo cáo
            {search && <span> cho "<strong>{search}</strong>"</span>}
          </p>
        </div>

        {/* Issue List */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Không tìm thấy báo cáo nào</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã số</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Báo cáo</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vấn đề</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Đánh giá</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((issue, i) => {
                    const severity = issue.aiAnalysis?.severity ?? "medium";
                    const statusColor = STATUS_COLORS[issue.status] ?? "#6b7280";
                    const verifications = issue.verifications ?? [];
                    const avgRating = verifications.length > 0
                      ? verifications.reduce((sum, v) => sum + v.rating, 0) / verifications.length
                      : 0;

                    return (
                      <motion.tr
                        key={issue.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                            #VN{issue.issueCode ? issue.issueCode.replace("#VN", "").slice(-3) : issue.id.slice(-3).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={issue.imageUrl}
                              alt={issue.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {issue.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${SEVERITY_COLORS[severity]}`}>
                                  {SEVERITY_LABELS[severity]}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {formatDateShort(issue.reportedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span 
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: CATEGORY_COLORS[issue.category] }}
                          >
                            {CATEGORY_LABELS[issue.category]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 flex items-start gap-1">
                            <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{issue.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {avgRating > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold text-xs border border-amber-100">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {avgRating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">--</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className="px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-sm"
                            style={{ backgroundColor: statusColor }}
                          >
                            {STATUS_LABELS[issue.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end">
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          userId={user.id}
          userName={user.name}
        />
      )}
    </div>
  );
}