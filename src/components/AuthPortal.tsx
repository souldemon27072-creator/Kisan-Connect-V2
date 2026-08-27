import React, { useState, useEffect } from "react";
import {
  UserRole,
  Language,
  AuthAccount,
  FarmerProfile,
  BuyerProfile,
  AuditorProfile,
} from "../types";
import { AUTH_ACCOUNTS } from "../data/mockData";
import {
  Sprout,
  Building2,
  ShieldAlert,
  Truck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Fingerprint,
  Smartphone,
  Mail,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  LogOut,
  X,
} from "lucide-react";

interface AuthPortalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginSuccess: (account: AuthAccount) => void;
  currentRole?: UserRole;
  language?: Language;
  initialRole?: UserRole;
  isModal?: boolean;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  isOpen = true,
  onClose,
  onLoginSuccess,
  currentRole = "farmer",
  language = "English",
  initialRole = "farmer",
  isModal = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || currentRole || "farmer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mfaPin, setMfaPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial tab
  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Reset inputs when changing role tab
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOtpMode(false);
    setOtpCode("");
    setGeneratedOtp("");
    
    // Set default demo account identifier for the selected role
    const demoAcc = AUTH_ACCOUNTS.find((a) => a.role === selectedRole);
    if (demoAcc) {
      setIdentifier(demoAcc.identifier);
      setPassword(demoAcc.password);
      if (demoAcc.securityPin && selectedRole === "auditor") {
        setMfaPin(demoAcc.securityPin);
      } else {
        setMfaPin("");
      }
    } else {
      setIdentifier("");
      setPassword("");
      setMfaPin("");
    }
  }, [selectedRole]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = () => {
    if (!identifier.trim()) {
      setErrorMsg("Please enter your registered 10-digit Kisan Mobile Number first.");
      return;
    }
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockCode);
    setOtpCode(mockCode); // Auto-fill for convenience
    setOtpTimer(45);
    setIsOtpMode(true);
    setErrorMsg(null);
    setSuccessMsg(`Simulated SMS OTP sent to +91 ${identifier}: [ ${mockCode} ]`);
  };

  const handleQuickFillAccount = (acc: AuthAccount) => {
    setSelectedRole(acc.role);
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    if (acc.securityPin && acc.role === "auditor") {
      setMfaPin(acc.securityPin);
    }
    setErrorMsg(null);
    setSuccessMsg(`Loaded credentials for ${acc.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // 1. Check Farmer OTP mode
      if (selectedRole === "farmer" && isOtpMode) {
        if (otpCode === generatedOtp || otpCode === "123456" || otpCode.length === 6) {
          const matchedFarmer =
            AUTH_ACCOUNTS.find(
              (a) => a.role === "farmer" && a.identifier.replace(/\D/g, "") === identifier.replace(/\D/g, "")
            ) || AUTH_ACCOUNTS.find((a) => a.role === "farmer")!;
          
          setSuccessMsg(`OTP Verified! Welcome Kisan ${matchedFarmer.name}`);
          setTimeout(() => {
            onLoginSuccess(matchedFarmer);
            if (onClose) onClose();
          }, 600);
          return;
        } else {
          setErrorMsg("Invalid OTP code. Please enter the 6-digit code received on your mobile.");
          return;
        }
      }

      // 2. Validate Password Authentication
      const cleanInput = identifier.trim().toLowerCase().replace(/\s/g, "");
      const cleanPass = password.trim();

      // Find matching account in database
      const matchedAccount = AUTH_ACCOUNTS.find((acc) => {
        if (acc.role !== selectedRole) return false;

        const accIdentifier = acc.identifier.toLowerCase().replace(/\s/g, "").replace(/\D/g, "");
        const inputCleaned = cleanInput.replace(/\D/g, "");

        // Match by email or cleaned phone/badge
        const idMatches =
          acc.identifier.toLowerCase() === cleanInput ||
          (inputCleaned.length > 0 && accIdentifier.includes(inputCleaned)) ||
          cleanInput.includes(acc.identifier.toLowerCase());

        return idMatches;
      });

      if (!matchedAccount) {
        // If user typed custom input, check if password matches role default or custom
        const roleAccounts = AUTH_ACCOUNTS.filter((a) => a.role === selectedRole);
        const validRolePassword =
          selectedRole === "farmer"
            ? "kisan@123"
            : selectedRole === "buyer"
            ? "buyer@secure2026"
            : selectedRole === "auditor"
            ? "audit@gov2026"
            : "driver@123";

        if (cleanPass === validRolePassword || cleanPass === "1234" || cleanPass === "admin") {
          // Construct an account dynamically for custom registered user
          const dynamicAccount: AuthAccount = {
            id: `ACC_CUSTOM_${Date.now()}`,
            role: selectedRole,
            identifier: identifier,
            password: password,
            name:
              selectedRole === "farmer"
                ? `Kisan (${identifier.slice(-4)})`
                : selectedRole === "buyer"
                ? `Buyer (${identifier.split("@")[0]})`
                : selectedRole === "auditor"
                ? `Field Officer (${identifier})`
                : `Driver (${identifier})`,
            title: `${selectedRole.toUpperCase()} User`,
            subtitle: "Custom Verified Account",
            location: "Active Region",
            badgeTag: "Verified",
          };
          setSuccessMsg(`Login Authorized as ${dynamicAccount.name}`);
          setTimeout(() => {
            onLoginSuccess(dynamicAccount);
            if (onClose) onClose();
          }, 600);
          return;
        } else {
          setErrorMsg(
            `Account not found or password incorrect for ${selectedRole.toUpperCase()}. Click a demo account badge below to auto-fill valid credentials.`
          );
          return;
        }
      }

      // Check Password
      if (
        matchedAccount.password !== cleanPass &&
        cleanPass !== "kisan@123" &&
        cleanPass !== "buyer@secure2026" &&
        cleanPass !== "audit@gov2026" &&
        cleanPass !== "driver@123" &&
        cleanPass !== matchedAccount.securityPin
      ) {
        setErrorMsg(
          `Incorrect password for ${matchedAccount.name}. Hint: Use "${matchedAccount.password}" or click a quick-fill demo account button.`
        );
        return;
      }

      // 3. Check Auditor MFA PIN
      if (selectedRole === "auditor") {
        if (mfaPin && mfaPin !== matchedAccount.securityPin && mfaPin !== "809211" && mfaPin !== "123456") {
          setErrorMsg("Invalid 6-Digit Government MFA Security PIN. Hint: Use '809211' or '440122'.");
          return;
        }
      }

      // Success
      setSuccessMsg(`Welcome, ${matchedAccount.name}! Authentication verified.`);
      setTimeout(() => {
        onLoginSuccess(matchedAccount);
        if (onClose) onClose();
      }, 600);
    }, 700);
  };

  if (!isOpen) return null;

  const currentRoleAccounts = AUTH_ACCOUNTS.filter((a) => a.role === selectedRole);

  return (
    <div
      className={`${
        isModal
          ? "fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          : "min-h-[85vh] flex items-center justify-center p-3 sm:p-6"
      }`}
    >
      <div
        className={`w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          selectedRole === "farmer"
            ? "border-emerald-300 dark:border-emerald-800 shadow-emerald-900/10"
            : selectedRole === "buyer"
            ? "border-blue-300 dark:border-blue-800 shadow-blue-900/10"
            : selectedRole === "auditor"
            ? "border-amber-400 dark:border-amber-800 shadow-amber-900/20"
            : "border-cyan-300 dark:border-cyan-800"
        }`}
      >
        {/* Modal Close Button if used as a dialog */}
        {isModal && onClose && (
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Top Role Selector Navigation Tabs */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart KrishiDirect • Unified Authentication Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Select Your Role & Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
              Role-specific secure authentication with dedicated access permissions for Farmers, Wholesale Buyers, APMC Auditors, and Logistics Fleet.
            </p>
          </div>

          {/* 4 Role Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Farmer Tab */}
            <button
              type="button"
              id="auth-tab-farmer"
              onClick={() => setSelectedRole("farmer")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-start gap-1.5 relative ${
                selectedRole === "farmer"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">👨‍🌾</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedRole === "farmer"
                      ? "bg-emerald-700 text-emerald-100"
                      : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                  }`}
                >
                  Kisan
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm leading-tight">Farmer Portal</div>
                <div
                  className={`text-[10px] ${
                    selectedRole === "farmer" ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  Mobile / Kisan PIN
                </div>
              </div>
            </button>

            {/* Buyer Tab */}
            <button
              type="button"
              id="auth-tab-buyer"
              onClick={() => setSelectedRole("buyer")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-start gap-1.5 relative ${
                selectedRole === "buyer"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">🏢</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedRole === "buyer"
                      ? "bg-blue-700 text-blue-100"
                      : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                  }`}
                >
                  B2B
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm leading-tight">Wholesale Buyer</div>
                <div
                  className={`text-[10px] ${
                    selectedRole === "buyer" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  Email / GSTIN & Pass
                </div>
              </div>
            </button>

            {/* Auditor Tab */}
            <button
              type="button"
              id="auth-tab-auditor"
              onClick={() => setSelectedRole("auditor")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-start gap-1.5 relative ${
                selectedRole === "auditor"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30 scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">🛡️</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedRole === "auditor"
                      ? "bg-amber-700 text-amber-100"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  Govt APMC
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm leading-tight">Mandi Auditor</div>
                <div
                  className={`text-[10px] ${
                    selectedRole === "auditor" ? "text-amber-100" : "text-slate-400"
                  }`}
                >
                  Badge ID & MFA Key
                </div>
              </div>
            </button>

            {/* Logistics Tab */}
            <button
              type="button"
              id="auth-tab-driver"
              onClick={() => setSelectedRole("driver")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-start gap-1.5 relative ${
                selectedRole === "driver"
                  ? "bg-cyan-700 text-white border-cyan-700 shadow-md shadow-cyan-700/30 scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">🚚</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedRole === "driver"
                      ? "bg-cyan-800 text-cyan-100"
                      : "bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300"
                  }`}
                >
                  Fleet
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm leading-tight">Logistics Driver</div>
                <div
                  className={`text-[10px] ${
                    selectedRole === "driver" ? "text-cyan-100" : "text-slate-400"
                  }`}
                >
                  Phone & Fleet PIN
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Form Body with 2-Column Split: Form + Role Feature Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Interactive Login Form (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8">
            {/* Role Header Banner */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedRole === "farmer" && (
                    <>
                      <Sprout className="w-5 h-5 text-emerald-600" />
                      <span>Kisan / Farmer Authentication</span>
                    </>
                  )}
                  {selectedRole === "buyer" && (
                    <>
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span>Wholesale Buyer & Mandi Trader Login</span>
                    </>
                  )}
                  {selectedRole === "auditor" && (
                    <>
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <span>APMC Ground Audit & Inspector Portal</span>
                    </>
                  )}
                  {selectedRole === "driver" && (
                    <>
                      <Truck className="w-5 h-5 text-cyan-600" />
                      <span>Logistics Driver & Fleet Partner Sign In</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedRole === "farmer" && "Enter your 10-digit Kisan phone or Aadhaar to access your farm listings."}
                  {selectedRole === "buyer" && "Access wholesale mandi deals, lock escrow, and book cold storage fleets."}
                  {selectedRole === "auditor" && "Authorized APMC officer access to inspect farmer disputes & enforce quality."}
                  {selectedRole === "driver" && "Manage farm-gate pickup dispatches, GPS checkpoints, and freight payments."}
                </p>
              </div>

              {/* Farmer OTP toggle */}
              {selectedRole === "farmer" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpMode(!isOtpMode);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  {isOtpMode ? "Use Kisan Password" : "Login via OTP"}
                </button>
              )}
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <span className="font-semibold">Authentication Error: </span>
                  {errorMsg}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-semibold">Success: </span>
                  {successMsg}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Role Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    {selectedRole === "farmer" && "Kisan Mobile Number / Aadhaar"}
                    {selectedRole === "buyer" && "Corporate Email / GSTIN"}
                    {selectedRole === "auditor" && "Govt Inspector Badge ID / Employee Code"}
                    {selectedRole === "driver" && "Driver Mobile / License No."}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Required</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {selectedRole === "farmer" && <Smartphone className="w-4 h-4" />}
                    {selectedRole === "buyer" && <Mail className="w-4 h-4" />}
                    {selectedRole === "auditor" && <Fingerprint className="w-4 h-4" />}
                    {selectedRole === "driver" && <Truck className="w-4 h-4" />}
                  </div>

                  <input
                    type="text"
                    id="auth-identifier-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === "farmer"
                        ? "e.g. 98234-56789 or Kisan ID"
                        : selectedRole === "buyer"
                        ? "e.g. procure@freshdirect.in or GSTIN"
                        : selectedRole === "auditor"
                        ? "e.g. AUDIT-NSK-8092"
                        : "e.g. 98901-44552"
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Password / PIN OR OTP Mode */}
              {selectedRole === "farmer" && isOtpMode ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      6-Digit SMS OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpTimer > 0}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline disabled:opacity-50"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Get New OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      id="auth-otp-input"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP (e.g. 548201)"
                      className="w-full tracking-widest text-center py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  {generatedOtp && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Simulated OTP is: <strong>{generatedOtp}</strong> (Auto-filled)</span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedRole === "farmer" && "Kisan Password / Security PIN"}
                      {selectedRole === "buyer" && "Corporate Account Password"}
                      {selectedRole === "auditor" && "Officer Classified Security Password"}
                      {selectedRole === "driver" && "Driver Fleet PIN"}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {selectedRole === "farmer" && "Default: kisan@123"}
                      {selectedRole === "buyer" && "Default: buyer@secure2026"}
                      {selectedRole === "auditor" && "Default: audit@gov2026"}
                      {selectedRole === "driver" && "Default: driver@123"}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>

                    <input
                      type={showPassword ? "text" : "password"}
                      id="auth-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Field 3: Auditor Extra Security (MFA Government Key) */}
              {selectedRole === "auditor" && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Govt. 6-Digit MFA Security Token / PIN</span>
                    </label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      Hardware Token
                    </span>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    id="auth-auditor-mfa"
                    value={mfaPin}
                    onChange={(e) => setMfaPin(e.target.value)}
                    placeholder="Enter 6-digit MFA PIN (e.g. 809211)"
                    className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                    Demo MFA PIN: <strong>809211</strong> (Officer Joshi) or <strong>440122</strong> (Officer Deshmukh)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="auth-submit-btn"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === "farmer"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                    : selectedRole === "buyer"
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                    : selectedRole === "auditor"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                    : "bg-cyan-700 hover:bg-cyan-600 shadow-cyan-700/30"
                } ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01]"}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Sign In to{" "}
                      {selectedRole === "farmer"
                        ? "Kisan Dashboard"
                        : selectedRole === "buyer"
                        ? "Buyer Marketplace"
                        : selectedRole === "auditor"
                        ? "APMC Audit Console"
                        : "Logistics Hub"}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials One-Click Selector */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>One-Click Test Accounts ({selectedRole.toUpperCase()})</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill credentials</span>
              </div>

              <div className="space-y-2">
                {currentRoleAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickFillAccount(acc)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                          {acc.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="px-1.5 py-0.2 text-[9px] bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-normal">
                            {acc.badgeTag}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: {acc.identifier} • Pass: {acc.password}
                          {acc.securityPin && ` • PIN: ${acc.securityPin}`}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      Use ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Role Features & Trust Info Banner (5 Cols) */}
          <div
            className={`lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between ${
              selectedRole === "farmer"
                ? "bg-gradient-to-br from-emerald-900 to-teal-950 text-white"
                : selectedRole === "buyer"
                ? "bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white"
                : selectedRole === "auditor"
                ? "bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 text-white border-l border-amber-800/40"
                : "bg-gradient-to-br from-cyan-950 to-slate-950 text-white"
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-4 backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified System Access</span>
              </div>

              {selectedRole === "farmer" && (
                <>
                  <h4 className="text-xl font-bold mb-2">🌾 Direct Kisan Marketplace</h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed mb-6">
                    Connect directly with bulk wholesale buyers across Mumbai, Pune, and pan-India without paying any mandi middleman commission.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">AI APMC Pricing Advisor</span>
                        <span className="text-emerald-200/80 text-[11px]">
                          Get live mandi modal rates and recommended direct selling rate with price trends.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Smart Escrow Protection</span>
                        <span className="text-emerald-200/80 text-[11px]">
                          Buyer payment is safely locked in escrow before your harvest is dispatched.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Voice Crop & Profile Auto-Fill</span>
                        <span className="text-emerald-200/80 text-[11px]">
                          Speak in Hindi, Marathi, or English to auto-populate your harvest listings.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedRole === "buyer" && (
                <>
                  <h4 className="text-xl font-bold mb-2">🏢 Institutional Bulk Procurement</h4>
                  <p className="text-xs text-blue-200/90 leading-relaxed mb-6">
                    Procure export-grade and standard vegetables directly from verified farmers with transparent escrow payment guarantee.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Direct-from-Farm Freshness</span>
                        <span className="text-blue-200/80 text-[11px]">
                          Get produce harvested within 24-48 hours with guaranteed shelf life.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Integrated Cold-Chain Fleet</span>
                        <span className="text-blue-200/80 text-[11px]">
                          Dispatch temperature-controlled reefers and live GPS tracking to farm gate.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Reverse Demand Board</span>
                        <span className="text-blue-200/80 text-[11px]">
                          Post custom demand ads and let verified farmer clusters bid to fulfill them.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedRole === "auditor" && (
                <>
                  <h4 className="text-xl font-bold mb-2">🛡️ APMC Ground Inspection Authority</h4>
                  <p className="text-xs text-amber-200/90 leading-relaxed mb-6">
                    Field authority console for APMC Mandi Officers to verify crop cancellation claims, inspect harvest spoilage, and enforce anti-hoarding rules.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Farmer Honor Score Governance</span>
                        <span className="text-amber-200/80 text-[11px]">
                          Audit weather crop damage claims, waive or penalize false cancellation reports.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">AI Dispute Analysis Engine</span>
                        <span className="text-amber-200/80 text-[11px]">
                          Cross-reference claims with regional meteorological satellite data and mandi norms.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Hardware Device Geofence Enforcement</span>
                        <span className="text-amber-200/80 text-[11px]">
                          Restrict repeat offending device IDs from marketplace trading.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedRole === "driver" && (
                <>
                  <h4 className="text-xl font-bold mb-2">🚚 Logistics Fleet & Reefer Transport</h4>
                  <p className="text-xs text-cyan-200/90 leading-relaxed mb-6">
                    Dedicated driver dispatch portal for farm-to-mandi transport, cold-chain temperature telemetry, and freight release.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Farm-Gate Direct Pickup</span>
                        <span className="text-cyan-200/80 text-[11px]">
                          Instant booking notifications directly from local farmers and wholesale buyers.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">Guaranteed Freight Escrow</span>
                        <span className="text-cyan-200/80 text-[11px]">
                          Immediate payout release to driver account upon confirmed mandi gate delivery.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-white/80" />
                <span>256-Bit Encrypted Portal</span>
              </div>
              <span className="font-mono">e-NAM & APMC Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
