import React, { useState, useEffect } from "react";
import {
  UserRole,
  Language,
  Theme,
  FarmerProfile,
  BuyerProfile,
  AuditorProfile,
  AuthAccount,
  CropListing,
  OrderRecord,
  ChatMessage,
  CancellationClaim,
  BuyerAd,
  ColdStorageFacility,
  ColdStorageBooking,
  DeliveryPartner,
  DeliveryBookingRequest,
} from "./types";
import {
  INITIAL_FARMER,
  INITIAL_BUYER,
  INITIAL_AUDITOR,
  AUTH_ACCOUNTS,
  INITIAL_LISTINGS,
  INITIAL_ORDERS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_CANCELLATIONS,
  INITIAL_BUYER_ADS,
  INITIAL_COLD_STORAGES,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_DELIVERY_BOOKINGS,
} from "./data/mockData";
import { LOCALIZATION } from "./data/localization";
import { Navbar } from "./components/Navbar";
import { AuthPortal } from "./components/AuthPortal";
import { FarmerDashboard } from "./components/FarmerDashboard";
import { BuyerMarketplace } from "./components/BuyerMarketplace";
import { LiveChatModule } from "./components/LiveChatModule";
import { OrderTrackingModule } from "./components/OrderTrackingModule";
import { ColdStorageLocator } from "./components/ColdStorageLocator";
import { GroundAuditDashboard } from "./components/GroundAuditDashboard";
import { DeliveryPartnerHub } from "./components/DeliveryPartnerHub";
import {
  Sprout,
  ShoppingBag,
  ShieldAlert,
  Truck,
  Snowflake,
  MessageSquare,
  Sparkles,
  Layers,
  Phone,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export function App() {
  // Global State
  const [language, setLanguage] = useState<Language>("English");
  const [currentRole, setCurrentRole] = useState<UserRole>("farmer");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("krishi_auth_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          console.error("Failed to parse saved user", e);
        }
      }
    }
    return AUTH_ACCOUNTS[0]; // Default logged-in account (Farmer Ramesh Kumar Patil)
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>("farmer");

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("krishi_theme");
      if (saved === "dark" || saved === "light") {
        return saved;
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  // Sync theme with DOM and localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("krishi_theme", theme);
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Core Data State
  const [farmer, setFarmer] = useState<FarmerProfile>(
    currentUser?.farmerProfile || INITIAL_FARMER
  );
  const [buyer, setBuyer] = useState<BuyerProfile>(
    currentUser?.buyerProfile || INITIAL_BUYER
  );
  const [auditor, setAuditor] = useState<AuditorProfile>(
    currentUser?.auditorProfile || INITIAL_AUDITOR
  );
  const [listings, setListings] = useState<CropListing[]>(INITIAL_LISTINGS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    INITIAL_CHAT_MESSAGES
  );
  const [cancellations, setCancellations] = useState<CancellationClaim[]>(
    INITIAL_CANCELLATIONS
  );
  const [buyerAds, setBuyerAds] = useState<BuyerAd[]>(INITIAL_BUYER_ADS);
  const [coldFacilities] = useState<ColdStorageFacility[]>(
    INITIAL_COLD_STORAGES
  );
  const [bannedDevices, setBannedDevices] = useState<string[]>([]);
  const [bookings, setBookings] = useState<ColdStorageBooking[]>([]);
  const [deliveryPartners] = useState<DeliveryPartner[]>(INITIAL_DELIVERY_PARTNERS);
  const [deliveryBookings, setDeliveryBookings] = useState<DeliveryBookingRequest[]>(
    INITIAL_DELIVERY_BOOKINGS
  );

  const l = LOCALIZATION[language];

  // Auth Handlers
  const handleOpenAuthModal = (targetRole?: UserRole) => {
    if (targetRole) {
      setAuthModalInitialRole(targetRole);
    } else {
      setAuthModalInitialRole(currentRole);
    }
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (account: AuthAccount) => {
    setCurrentUser(account);
    setCurrentRole(account.role);
    if (account.farmerProfile) {
      setFarmer(account.farmerProfile);
    }
    if (account.buyerProfile) {
      setBuyer(account.buyerProfile);
    }
    if (account.auditorProfile) {
      setAuditor(account.auditorProfile);
    }
    if (account.role === "driver") {
      setActiveTab("logistics");
    } else {
      setActiveTab("dashboard");
    }
    setIsAuthModalOpen(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("krishi_auth_user", JSON.stringify(account));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("krishi_auth_user");
    }
    setAuthModalInitialRole(currentRole);
    setIsAuthModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // If current logged-in user matches this role, keep user; otherwise switch active profile
    const matchedAccount = AUTH_ACCOUNTS.find((a) => a.role === role);
    if (matchedAccount) {
      setCurrentUser(matchedAccount);
      if (matchedAccount.farmerProfile) setFarmer(matchedAccount.farmerProfile);
      if (matchedAccount.buyerProfile) setBuyer(matchedAccount.buyerProfile);
      if (matchedAccount.auditorProfile) setAuditor(matchedAccount.auditorProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem("krishi_auth_user", JSON.stringify(matchedAccount));
      }
    }
    if (role === "driver") {
      setActiveTab("logistics");
    } else {
      setActiveTab("dashboard");
    }
  };

  // Action Handlers
  const handleAddListing = (newListing: CropListing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const handleBookDelivery = (booking: DeliveryBookingRequest) => {
    setDeliveryBookings((prev) => [booking, ...prev]);
  };

  const handleRequestCancellation = (claim: CancellationClaim) => {
    setCancellations((prev) => [claim, ...prev]);
    // Mark listing status
    setListings((prev) =>
      prev.map((l) =>
        l.id === claim.listing_id ? { ...l, status: "Under Audit" } : l
      )
    );
  };

  const handleAddBuyerAd = (ad: BuyerAd) => {
    setBuyerAds((prev) => [ad, ...prev]);
  };

  const handleLockEscrowAndPurchase = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    // Deduct buyer escrow balance
    setBuyer((prev) => ({
      ...prev,
      escrowBalance: Math.max(0, prev.escrowBalance - newOrder.amount),
      totalPurchases: prev.totalPurchases + 1,
    }));
    // Mark listing as In Transit
    setListings((prev) =>
      prev.map((l) =>
        l.id === newOrder.listing_id ? { ...l, status: "In Transit" } : l
      )
    );
  };

  const handleSendMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const handleBookColdStorage = (booking: ColdStorageBooking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const handleAdvanceOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.order_id !== orderId) return ord;

        const nextProgress = Math.min(100, ord.progress + 25);
        let nextStatus = ord.status;
        let nextEscrow = ord.escrowStatus;

        if (nextProgress === 50) {
          nextStatus = "Farm Gate Loaded & Weighed";
        } else if (nextProgress === 75) {
          nextStatus = "Cold Transit (Arriving at Mandi)";
        } else if (nextProgress === 100) {
          nextStatus = "Delivered & QR Verified";
          nextEscrow = "Escrow Released to Farmer";
        }

        const updatedCheckpoints = ord.checkpoints.map((cp, idx) => {
          if (nextProgress === 50 && idx <= 2) return { ...cp, completed: true };
          if (nextProgress === 75 && idx <= 2) return { ...cp, completed: true };
          if (nextProgress === 100) return { ...cp, completed: true };
          return cp;
        });

        return {
          ...ord,
          progress: nextProgress,
          status: nextStatus,
          escrowStatus: nextEscrow,
          checkpoints: updatedCheckpoints,
        };
      })
    );
  };

  const handleApproveCancellation = (claimId: string) => {
    setCancellations((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, status: "Approved (No Penalty)" } : c
      )
    );
    // Remove listing from active market
    const claim = cancellations.find((c) => c.id === claimId);
    if (claim) {
      setListings((prev) =>
        prev.map((l) =>
          l.id === claim.listing_id ? { ...l, status: "Cancelled" } : l
        )
      );
    }
  };

  const handleRejectCancellation = (claimId: string, penaltyPoints: number) => {
    setCancellations((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, status: "Rejected (25 Pts Deducted)" } : c
      )
    );

    // Apply Honor Score penalty
    setFarmer((prev) => {
      const newScore = Math.max(0, prev.honorScore - penaltyPoints);
      if (newScore < 50 && !(bannedDevices || []).includes(prev.deviceId)) {
        setBannedDevices((b) => [...(b || []), prev.deviceId]);
      }
      return { ...prev, honorScore: newScore };
    });
  };

  const handleToggleDeviceBan = (deviceId: string) => {
    setBannedDevices((prev) =>
      (prev || []).includes(deviceId)
        ? (prev || []).filter((d) => d !== deviceId)
        : [...(prev || []), deviceId]
    );
  };

  // Farmer Profiles map for quick buyer lookup
  const farmerProfilesMap: Record<string, FarmerProfile> = farmer
    ? {
        [farmer.id]: farmer,
      }
    : {};

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar with Authentication Status */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        language={language}
        onSelectLanguage={setLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        farmer={farmer}
        buyer={buyer}
        auditor={auditor}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        bannedDevices={bannedDevices || []}
        farmerHonorScore={farmer?.honorScore || 88}
        isDeviceBanned={(bannedDevices || []).includes(farmer?.deviceId || "")}
        pendingAuditsCount={
          (cancellations || []).filter((c) => c.status === "Pending Audit").length
        }
        activeOrdersCount={(orders || []).length}
      />

      {/* Role Navigation Secondary Sub-Bar for Farmer / Buyer Views */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 overflow-x-auto gap-4">
            <div className="flex items-center gap-1.5 shrink-0">
              {currentRole === "farmer" && (
                <>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{l.farmer_tab}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "chat"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{l.chat_tab}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tracking")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "tracking"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{l.track_tab}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-full border border-emerald-200 dark:border-emerald-800">
                      {orders.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("logistics")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "logistics"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Logistics Partners</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] rounded-full border border-blue-200 dark:border-blue-800">
                      {deliveryPartners.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("coldstorage")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "coldstorage"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>{l.cold_tab}</span>
                  </button>
                </>
              )}

              {currentRole === "buyer" && (
                <>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{l.buyer_tab}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "chat"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{l.chat_tab}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tracking")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "tracking"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{l.track_tab}</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] rounded-full border border-blue-200 dark:border-blue-800">
                      {orders.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("logistics")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "logistics"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Logistics Fleet</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] rounded-full border border-blue-200 dark:border-blue-800">
                      {deliveryPartners.length}
                    </span>
                  </button>
                </>
              )}

              {currentRole === "auditor" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    <span>APMC Ground Dispute Resolution & Sanction Console</span>
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-300 dark:border-amber-700">
                    Badge: {auditor.badgeId}
                  </span>
                </div>
              )}

              {currentRole === "driver" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                    <span>Farm-Gate Direct Logistics Fleet & Cold Dispatch Hub</span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Switch Persona / Login Button on Right */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => handleOpenAuthModal(currentRole)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Switch / Login ({currentRole.toUpperCase()})</span>
              </button>

              {/* Live APMC Ticker Mini */}
              <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  APMC Modal:
                </span>
                <span>Tomatoes ₹25/kg</span>
                <span>•</span>
                <span>Onions ₹18/kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === "farmer" && (
          <>
            {activeTab === "dashboard" && (
              <FarmerDashboard
                farmer={farmer}
                listings={listings}
                onAddListing={handleAddListing}
                onRequestCancellation={handleRequestCancellation}
                language={language}
                onNavigateToTab={setActiveTab}
                bannedDevices={bannedDevices}
                onUpdateFarmer={(updates) => setFarmer((prev) => ({ ...prev, ...updates }))}
              />
            )}

            {activeTab === "chat" && (
              <LiveChatModule
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                currentRole="farmer"
                language={language}
                recipientName="AgriCorp Procurements (Buyer)"
              />
            )}

            {activeTab === "tracking" && (
              <OrderTrackingModule
                orders={orders}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
                currentRole="farmer"
                language={language}
              />
            )}

            {activeTab === "logistics" && (
              <DeliveryPartnerHub
                deliveryPartners={deliveryPartners}
                partners={deliveryPartners}
                bookings={deliveryBookings}
                existingBookings={deliveryBookings}
                onBookDelivery={handleBookDelivery}
                currentRole="farmer"
                farmer={farmer}
                userName={farmer.name}
                userPhone={farmer.phone}
                userLocation={farmer.location}
                language={language}
              />
            )}

            {activeTab === "coldstorage" && (
              <ColdStorageLocator
                facilities={coldFacilities}
                farmerName={farmer.name}
                language={language}
                onBookSlot={handleBookColdStorage}
              />
            )}
          </>
        )}

        {currentRole === "buyer" && (
          <>
            {activeTab === "dashboard" && (
              <BuyerMarketplace
                buyer={buyer}
                listings={listings}
                farmerProfiles={farmerProfilesMap}
                buyerAds={buyerAds}
                onAddBuyerAd={handleAddBuyerAd}
                onLockEscrowAndPurchase={handleLockEscrowAndPurchase}
                language={language}
                onOpenChatWithFarmer={(farmerName) => setActiveTab("chat")}
                onNavigateToLogistics={() => setActiveTab("logistics")}
              />
            )}

            {activeTab === "chat" && (
              <LiveChatModule
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                currentRole="buyer"
                language={language}
                recipientName="Ramesh Kumar (Farmer)"
              />
            )}

            {activeTab === "tracking" && (
              <OrderTrackingModule
                orders={orders}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
                currentRole="buyer"
                language={language}
              />
            )}

            {activeTab === "logistics" && (
              <DeliveryPartnerHub
                deliveryPartners={deliveryPartners}
                partners={deliveryPartners}
                bookings={deliveryBookings}
                existingBookings={deliveryBookings}
                onBookDelivery={handleBookDelivery}
                currentRole="buyer"
                buyer={buyer}
                userName={buyer.name}
                userPhone="+91 91234-56780"
                userLocation={buyer.location}
                language={language}
              />
            )}
          </>
        )}

        {currentRole === "auditor" && (
          <GroundAuditDashboard
            cancellations={cancellations}
            farmer={farmer}
            bannedDevices={bannedDevices}
            onApproveCancellation={handleApproveCancellation}
            onRejectCancellation={handleRejectCancellation}
            onToggleDeviceBan={handleToggleDeviceBan}
            language={language}
          />
        )}

        {currentRole === "driver" && (
          <DeliveryPartnerHub
            deliveryPartners={deliveryPartners}
            partners={deliveryPartners}
            bookings={deliveryBookings}
            existingBookings={deliveryBookings}
            onBookDelivery={handleBookDelivery}
            currentRole="driver"
            userName={currentUser?.name || "Bablu Transporters"}
            userPhone={currentUser?.identifier || "+91 98901-44552"}
            userLocation={currentUser?.location || "Nashik-Mumbai Corridor"}
            language={language}
          />
        )}
      </main>

      {/* Role-Specific Authentication Modal with Passwords */}
      <AuthPortal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentRole={currentRole}
        initialRole={authModalInitialRole}
        language={language}
        isModal={true}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Smart KrishiDirect</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">SIH26033 National Agricultural Solution</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500">
            Role-Protected Access (Farmer: <code className="text-emerald-600 font-mono">kisan@123</code> • Buyer: <code className="text-blue-600 font-mono">buyer@secure2026</code> • Auditor: <code className="text-amber-600 font-mono">audit@gov2026</code>)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

