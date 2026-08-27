import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Language, UserRole } from "../types";
import { LOCALIZATION } from "../data/localization";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Sparkles,
  CheckCheck,
  Bot,
  User,
  ShieldCheck,
  Check,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface LiveChatModuleProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  currentRole: UserRole;
  language: Language;
  recipientName?: string;
}

export const LiveChatModule: React.FC<LiveChatModuleProps> = ({
  messages,
  onSendMessage,
  currentRole,
  language,
  recipientName = "AgriCorp Procurements (Buyer)",
}) => {
  const l = LOCALIZATION[language];
  const [inputText, setInputText] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<{
    dataUrl: string;
    name: string;
    type: string;
  } | null>(null);
  const [loadingAiOffer, setLoadingAiOffer] = useState<boolean>(false);
  const [aiNegotiationSuggestion, setAiNegotiationSuggestion] = useState<{
    counterOfferPrice: number;
    englishSuggestion: string;
    hindiSuggestion: string;
    rationale: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const senderRoleTitle =
    currentRole === "farmer"
      ? "Farmer"
      : currentRole === "buyer"
      ? "Buyer"
      : currentRole === "auditor"
      ? "Auditor"
      : "Driver";

  const senderDisplayName =
    currentRole === "farmer"
      ? "Ramesh Kumar (Farmer)"
      : currentRole === "buyer"
      ? "AgriCorp (Buyer)"
      : currentRole === "auditor"
      ? "Field Auditor (Audit)"
      : "Vikram Singh (Driver)";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle File Attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          dataUrl: reader.result as string,
          name: file.name,
          type: file.type || "application/octet-stream",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Send Message
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: senderDisplayName,
      role: senderRoleTitle as any,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      file: attachedFile ? attachedFile.dataUrl : null,
      fileType: attachedFile ? attachedFile.type : null,
      fileName: attachedFile ? attachedFile.name : null,
    };

    onSendMessage(newMsg);
    setInputText("");
    setAttachedFile(null);
  };

  // Generate AI Counter-Offer Assistance
  const fetchAiNegotiation = async () => {
    setLoadingAiOffer(true);
    try {
      const res = await fetch("/api/gemini/negotiate-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: senderRoleTitle,
          crop: "Tomatoes",
          currentOffer: 27.5,
          askedPrice: 28.5,
          quantity: 20,
          recentChat: messages.slice(-4),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiNegotiationSuggestion({
          counterOfferPrice: data.counterOfferPrice || 28.0,
          englishSuggestion: data.englishSuggestion,
          hindiSuggestion: data.hindiSuggestion,
          rationale: data.rationale,
        });
      }
    } catch (e) {
      console.warn("AI Negotiation error:", e);
    } finally {
      setLoadingAiOffer(false);
    }
  };

  const applyAiSuggestion = (text: string) => {
    setInputText(text);
    setAiNegotiationSuggestion(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 overflow-hidden flex flex-col h-[680px] transition-colors">
      {/* Chat Room Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            {currentRole === "farmer" ? "🛒" : "👨‍🌾"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">
                {currentRole === "farmer" ? "AgriCorp Procurements (Buyer)" : "Ramesh Kumar (Farmer)"}
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-emerald-300 font-semibold uppercase">Online</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Contract Ref: Listing #LST-101 • End-to-End Escrow Protected
            </p>
          </div>
        </div>

        {/* AI Negotiation Assistant Trigger */}
        <button
          onClick={fetchAiNegotiation}
          disabled={loadingAiOffer}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loadingAiOffer ? "Formulating Offer..." : l.counter_offer}</span>
        </button>
      </div>

      {/* AI Suggestion Banner if generated */}
      {aiNegotiationSuggestion && (
        <div className="bg-emerald-950 text-white p-3.5 border-b border-emerald-800/80 text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-400" />
              AI Recommended Fair Counter-Offer: ₹{aiNegotiationSuggestion.counterOfferPrice}/kg
            </span>
            <button
              onClick={() => setAiNegotiationSuggestion(null)}
              className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              onClick={() => applyAiSuggestion(aiNegotiationSuggestion.englishSuggestion)}
              className="p-2.5 bg-emerald-900/60 hover:bg-emerald-800/80 rounded-xl text-left border border-emerald-700/60 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">
                Insert English:
              </span>
              <p className="text-emerald-100 text-[11px] leading-snug">
                "{aiNegotiationSuggestion.englishSuggestion}"
              </p>
            </button>

            <button
              onClick={() => applyAiSuggestion(aiNegotiationSuggestion.hindiSuggestion)}
              className="p-2.5 bg-emerald-900/60 hover:bg-emerald-800/80 rounded-xl text-left border border-emerald-700/60 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">
                Insert हिन्दी:
              </span>
              <p className="text-emerald-100 text-[11px] leading-snug">
                "{aiNegotiationSuggestion.hindiSuggestion}"
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/50">
        <div className="text-center my-2">
          <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium rounded-full">
            🔒 End-to-End Encrypted Direct Negotiation Channel
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.role === senderRoleTitle;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-xs text-xs space-y-2 ${
                  isMe
                    ? "bg-slate-800 dark:bg-emerald-700 text-white rounded-tr-xs"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs"
                }`}
              >
                {/* Sender Header */}
                <div className="flex items-center justify-between gap-3 text-[11px] opacity-80 pb-1 border-b border-white/10 dark:border-white/10">
                  <span className="font-bold flex items-center gap-1">
                    {msg.sender}
                  </span>
                  <span className="font-mono text-[10px]">{msg.time}</span>
                </div>

                {/* Text Content */}
                {msg.text && (
                  <p className="leading-relaxed text-xs whitespace-pre-wrap">{msg.text}</p>
                )}

                {/* Offer Price Highlight if specified */}
                {msg.offerPrice && (
                  <div
                    className={`p-2 rounded-lg font-bold flex items-center justify-between text-xs ${
                      isMe
                        ? "bg-emerald-600/40 text-emerald-300 border border-emerald-500/40"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    <span>Proposed Settlement Rate:</span>
                    <span className="text-sm font-extrabold">₹{msg.offerPrice.toFixed(2)}/kg</span>
                  </div>
                )}

                {/* Attached Photo Preview */}
                {msg.file && (msg.fileType || "").includes("image") && (
                  <div className="rounded-xl overflow-hidden border border-white/20 mt-1 max-w-[260px]">
                    <img
                      src={msg.file}
                      alt="Attachment"
                      className="w-full h-auto object-cover max-h-48 rounded-lg"
                    />
                  </div>
                )}

                {/* Attached Document Download */}
                {msg.file && !(msg.fileType || "").includes("image") && (
                  <a
                    href={msg.file}
                    download={msg.fileName || "quality_certificate.pdf"}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isMe
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {msg.fileName || "Document"}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Bar before sending */}
      {attachedFile && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            {(attachedFile.type || "").includes("image") ? (
              <img
                src={attachedFile.dataUrl}
                alt="Upload preview"
                className="w-8 h-8 rounded object-cover border border-emerald-400"
              />
            ) : (
              <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            )}
            <span className="font-semibold truncate max-w-xs">{attachedFile.name}</span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 text-xs px-2 py-1 cursor-pointer"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Quick Negotiation Action Chips */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] transition-colors">
        <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Quick Options:</span>
        <button
          onClick={() => setInputText("Yes, I accept this price offer. Please proceed to lock escrow.")}
          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 transition-colors cursor-pointer"
        >
          ✓ Accept Offer & Lock Escrow
        </button>
        <button
          onClick={() => setInputText("Can you please share a live photo of the packed produce batch?")}
          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 transition-colors cursor-pointer"
        >
          📷 Request Freshness Photo
        </button>
        <button
          onClick={() => setInputText("I can confirm pickup within 12 hours if rate is finalized at ₹28.00/kg.")}
          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 transition-colors cursor-pointer"
        >
          ⚡ Counter Offer: ₹28.00/kg
        </button>
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Photo or Document"
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={l.type_msg}
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !attachedFile}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{l.send_btn}</span>
        </button>
      </form>
    </div>
  );
};
