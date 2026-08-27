import React, { useState } from "react";
import { CancellationClaim, FarmerProfile, Language } from "../types";
import { LOCALIZATION } from "../data/localization";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Smartphone,
  Calendar,
  FileText,
  Bot,
  RefreshCw,
  Search,
  Check,
  Ban,
  Activity,
} from "lucide-react";

interface GroundAuditDashboardProps {
  cancellations: CancellationClaim[];
  farmer: FarmerProfile;
  bannedDevices?: string[];
  onApproveCancellation: (claimId: string) => void;
  onRejectCancellation: (claimId: string, penalty: number) => void;
  onToggleDeviceBan: (deviceId: string) => void;
  language: Language;
}

export const GroundAuditDashboard: React.FC<GroundAuditDashboardProps> = ({
  cancellations = [],
  farmer,
  bannedDevices = [],
  onApproveCancellation,
  onRejectCancellation,
  onToggleDeviceBan,
  language,
}) => {
  const l = LOCALIZATION[language] || LOCALIZATION["English"];

  // AI Audit State
  const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
  const [aiAuditResults, setAiAuditResults] = useState<
    Record<string, { verdict: string; penaltyScoreDeduction: number; recommendation: string; notes: string }>
  >({});
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Run Gemini Ground Audit Analysis
  const runAiAudit = async (claim: CancellationClaim) => {
    setAnalyzingClaimId(claim.id);
    try {
      const res = await fetch("/api/gemini/audit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: claim.crop,
          reason: claim.reason,
          listingDetails: { id: claim.listing_id, qty: claim.qty },
          honorScore: farmer?.honorScore ?? 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAuditResults((prev) => ({
          ...prev,
          [claim.id]: {
            verdict: data.verdict || "VALID_CLAIM",
            penaltyScoreDeduction: data.penaltyScoreDeduction ?? 0,
            recommendation: data.recommendation || "Verified natural disaster claim.",
            notes: data.notes || "Proceed with penalty waiver.",
          },
        }));
      }
    } catch (e) {
      console.warn("AI Audit Error:", e);
    } finally {
      setAnalyzingClaimId(null);
    }
  };

  const isFarmerBanned =
    (bannedDevices || []).includes(farmer?.deviceId || "") ||
    (farmer?.honorScore ?? 100) < 50;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/90 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            🕵️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                Field Representative Audit Portal
              </h1>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-400/40">
                Ground Inspector Clearance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify cancellation disputes, review Force Majeure claims, and enforce trust score sanctions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 dark:bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Pending Claims
            </span>
            <span className="text-xl font-extrabold text-amber-400">
              {(cancellations || []).filter((c) => c.status === "Pending Audit").length}
            </span>
          </div>

          <div className="bg-slate-800/80 dark:bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Restricted Devices
            </span>
            <span className="text-xl font-extrabold text-red-400">
              {(bannedDevices || []).length}
            </span>
          </div>
        </div>
      </div>

      {auditSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs md:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{auditSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAuditSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:text-emerald-900 dark:hover:text-white text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Pending Cancellations Queue (Left 8 Cols) & Hardware Device Fingerprint Registry (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Cancellations */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Pending Cancellation Audits</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Mandatory review before escrow refund
            </span>
          </div>

          {cancellations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                All cancellation claims have been verified!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Zero disputes pending in the ground representative queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancellations.map((claim, idx) => {
                const aiAudit = aiAuditResults[claim.id];
                const isAnalyzing = analyzingClaimId === claim.id;

                return (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 text-xs space-y-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Claim #{claim.id}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold rounded-full text-[10px] border border-amber-200 dark:border-amber-800">
                            {claim.status}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Farmer: <strong className="text-slate-800 dark:text-slate-200">{claim.farmer_name}</strong> ({claim.farmer_id}) • Listing Ref: <strong className="font-mono text-slate-800 dark:text-slate-200">#{claim.listing_id}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Produce Batch:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {claim.crop} ({claim.qty} Qtl)
                        </span>
                      </div>
                    </div>

                    {/* Reason Claim Box */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                        Reason Claimed by Farmer:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">
                        "{claim.reason}"
                      </p>
                    </div>

                    {/* Gemini AI Dispute Evaluation Engine */}
                    {aiAudit ? (
                      <div className="p-3.5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-xl border border-emerald-700/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-emerald-400" />
                            AI Ground Evidence Assessment:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (aiAudit.verdict || "").includes("VALID")
                                ? "bg-emerald-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {aiAudit.verdict}
                          </span>
                        </div>
                        <p className="text-emerald-100 text-[11px] leading-relaxed">
                          {aiAudit.recommendation}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Cross-reference regional weather radar & mandi price movement
                        </span>
                        <button
                          onClick={() => runAiAudit(claim)}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          {isAnalyzing ? "Analyzing..." : l.ai_audit_btn}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons: Approve (No Penalty) vs Reject (-25 Honor Points) */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          onApproveCancellation(claim.id);
                          setAuditSuccessMsg(
                            `Claim #${claim.id} verified as legitimate Force Majeure. Penalty waived with zero score deduction.`
                          );
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{l.approve_waiver}</span>
                      </button>

                      <button
                        onClick={() => {
                          onRejectCancellation(claim.id, 25);
                          setAuditSuccessMsg(
                            `Claim #${claim.id} rejected. 25 Honor Points deducted from farmer reputation. New Score: ${Math.max(
                              0,
                              farmer.honorScore - 25
                            )}/100.`
                          );
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{l.reject_penalty}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Hardware Device Fingerprint & Reputation Registry */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-5 space-y-4 text-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Device Fingerprint Registry</span>
              </h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono font-medium">
                Hardware Bound
              </span>
            </div>

            {/* Farmer Device Status Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{farmer.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isFarmerBanned
                      ? "bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {isFarmerBanned ? "⛔ RESTRICTED" : "✅ ACTIVE"}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Hardware UUID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{farmer.deviceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Honor Score:</span>
                  <span
                    className={`font-bold ${
                      farmer.honorScore >= 70
                        ? "text-emerald-700 dark:text-emerald-400"
                        : farmer.honorScore >= 50
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400 font-extrabold"
                    }`}
                  >
                    {farmer.honorScore} / 100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aadhaar e-KYC:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">{farmer.aadhaarMasked}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onToggleDeviceBan(farmer?.deviceId || "")}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    (bannedDevices || []).includes(farmer?.deviceId || "")
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>
                    {(bannedDevices || []).includes(farmer?.deviceId || "")
                      ? "Lift Device Restriction"
                      : "Manually Restrict Device ID"}
                  </span>
                </button>
              </div>
            </div>

            {/* Reputation Enforcement Rules Note */}
            <div className="p-3 bg-slate-900 dark:bg-slate-950 text-slate-200 rounded-xl text-[11px] space-y-1 leading-relaxed border border-slate-800">
              <p className="font-bold text-white flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                Automated SIH26033 Sanction Rules:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[10px]">
                <li>Score &lt; 70: Bulk harvest publishing (&gt;10 Qtl) disabled.</li>
                <li>Score &lt; 50: Complete device freeze and account suspension.</li>
                <li>Each rejected cancellation deducts 25 points.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
