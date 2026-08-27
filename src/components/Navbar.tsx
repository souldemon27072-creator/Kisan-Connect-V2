import React from "react";
import {
  Sprout,
  ShieldCheck,
  UserCheck,
  ShoppingCart,
  Search,
  Truck,
  Globe,
  AlertTriangle,
  Lock,
  Sparkles,
  Smartphone,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  UserCircle2,
} from "lucide-react";
import {
  UserRole,
  Language,
  FarmerProfile,
  BuyerProfile,
  AuditorProfile,
  AuthAccount,
  Theme,
} from "../types";
import { LOCALIZATION } from "../data/localization";

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole?: (role: UserRole) => void;
  setRole?: (role: UserRole) => void;
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  setLanguage?: (lang: Language) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  farmer?: FarmerProfile;
  buyer?: BuyerProfile;
  auditor?: AuditorProfile;
  currentUser?: AuthAccount | null;
  onOpenAuthModal?: (targetRole?: UserRole) => void;
  onLogout?: () => void;
  bannedDevices?: string[];
  farmerHonorScore?: number;
  isDeviceBanned?: boolean;
  cancellationsCount?: number;
  pendingAuditsCount?: number;
  activeOrdersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  setRole,
  language,
  onSelectLanguage,
  setLanguage,
  theme = "light",
  onToggleTheme,
  setTheme,
  farmer,
  buyer,
  auditor,
  currentUser,
  onOpenAuthModal,
  onLogout,
  bannedDevices = [],
  farmerHonorScore,
  isDeviceBanned,
  cancellationsCount = 0,
  pendingAuditsCount = 0,
  activeOrdersCount = 0,
}) => {
  const l = LOCALIZATION[language] || LOCALIZATION["English"];
  const handleRoleChange = onSelectRole || setRole || (() => {});
  const handleLanguageChange = onSelectLanguage || setLanguage || (() => {});
  const handleToggleTheme = onToggleTheme || (() => {
    if (setTheme) {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  });

  const currentHonorScore = farmer?.honorScore ?? farmerHonorScore ?? 100;
  const currentDeviceId = farmer?.deviceId || "DEV-88902-X9";
  const isFarmerBanned =
    isDeviceBanned !== undefined
      ? isDeviceBanned
      : (bannedDevices || []).includes(currentDeviceId) || currentHonorScore < 50;

  const totalAudits = pendingAuditsCount || cancellationsCount || 0;

  const handleRoleButtonClick = (role: UserRole) => {
    handleRoleChange(role);
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-lg border-b border-emerald-800/60">
      {/* Top emergency / status ticker if penalty or warning applies */}
      {isFarmerBanned && currentRole === "farmer" && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{l.banned_msg}</span>
        </div>
      )}

      {currentHonorScore < 70 && currentHonorScore >= 50 && currentRole === "farmer" && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs md:text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{l.bulk_disabled_msg} (Current: {currentHonorScore}/100)</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo and Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-900/40 text-white ring-2 ring-emerald-400/30 shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg md:text-xl tracking-tight text-white flex items-center gap-1.5">
                  {l.app_title}
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-800 text-emerald-300 rounded border border-emerald-700/50">
                    SIH26033
                  </span>
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 hidden sm:block">
                Direct Farmer-to-Buyer Marketplace & Escrow Logistics
              </p>
            </div>
          </div>

          {/* Center Role Persona Switcher Pill */}
          <div className="hidden lg:flex items-center bg-emerald-900/80 p-1 rounded-xl border border-emerald-700/60 shadow-inner">
            <button
              id="role-farmer-btn"
              onClick={() => handleRoleButtonClick("farmer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentRole === "farmer"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-800/60"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>👨‍🌾 {l.farmer_role}</span>
            </button>

            <button
              id="role-buyer-btn"
              onClick={() => handleRoleButtonClick("buyer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentRole === "buyer"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-800/60"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>🏢 {l.buyer_role}</span>
            </button>

            <button
              id="role-auditor-btn"
              onClick={() => handleRoleButtonClick("auditor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all relative cursor-pointer ${
                currentRole === "auditor"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-800/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🛡️ {l.auditor_role}</span>
              {totalAudits > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-[10px] text-white rounded-full font-bold">
                  {totalAudits}
                </span>
              )}
            </button>

            <button
              id="role-driver-btn"
              onClick={() => handleRoleButtonClick("driver")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentRole === "driver"
                  ? "bg-cyan-700 text-white shadow-sm"
                  : "text-emerald-200 hover:text-white hover:bg-emerald-800/60"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>🚚 {l.driver_role}</span>
            </button>
          </div>

          {/* Right Controls: User Profile Badge, Auth Portal Trigger, Language, Theme */}
          <div className="flex items-center gap-2">
            {/* Active User Account Display & Switch Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-emerald-900/90 pl-2 pr-1 py-1 rounded-xl border border-emerald-700/60 text-xs">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-400/40 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.name[0]}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                  <span className="text-[11px] font-bold text-white max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {currentUser.badgeTag || currentUser.role.toUpperCase()}
                  </span>
                </div>

                {onOpenAuthModal && (
                  <button
                    onClick={() => onOpenAuthModal(currentRole)}
                    title="Switch Account / Login Portal"
                    className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 hover:bg-red-900/60 rounded-lg text-emerald-300 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onOpenAuthModal && (
                <button
                  onClick={() => onOpenAuthModal(currentRole)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )
            )}

            {/* Dark / Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={handleToggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-300 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-emerald-900/90 rounded-lg p-1 border border-emerald-700/60 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-300 ml-1 mr-1" />
              {(["English", "Hindi", "Marathi"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  id={`lang-btn-${lang.toLowerCase()}`}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    language === lang
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-emerald-300 hover:text-white"
                  }`}
                >
                  {lang === "English" ? "EN" : lang === "Hindi" ? "हिन्दी" : "मराठी"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="lg:hidden flex items-center justify-between gap-1 py-2 overflow-x-auto border-t border-emerald-800/80">
          <button
            onClick={() => handleRoleButtonClick("farmer")}
            className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 cursor-pointer ${
              currentRole === "farmer" ? "bg-emerald-500 text-white" : "text-emerald-200 bg-emerald-900/60"
            }`}
          >
            👨‍🌾 Farmer
          </button>
          <button
            onClick={() => handleRoleButtonClick("buyer")}
            className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 cursor-pointer ${
              currentRole === "buyer" ? "bg-blue-600 text-white" : "text-emerald-200 bg-emerald-900/60"
            }`}
          >
            🏢 Buyer
          </button>
          <button
            onClick={() => handleRoleButtonClick("auditor")}
            className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1 ${
              currentRole === "auditor" ? "bg-amber-600 text-white" : "text-emerald-200 bg-emerald-900/60"
            }`}
          >
            🛡️ Audit
            {totalAudits > 0 && (
              <span className="px-1 bg-red-500 text-[9px] text-white rounded-full">
                {totalAudits}
              </span>
            )}
          </button>
          <button
            onClick={() => handleRoleButtonClick("driver")}
            className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 cursor-pointer ${
              currentRole === "driver" ? "bg-cyan-700 text-white" : "text-emerald-200 bg-emerald-900/60"
            }`}
          >
            🚚 Logistics
          </button>
        </div>
      </div>
    </header>
  );
};

