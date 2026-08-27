import React, { useState } from "react";
import {
  BuyerProfile,
  CropListing,
  Language,
  FarmerProfile,
  BuyerAd,
  OrderRecord,
} from "../types";
import { LOCALIZATION } from "../data/localization";
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  Sparkles,
  ArrowUpDown,
  Smartphone,
  Building,
  PlusCircle,
  Eye,
  CreditCard,
  Check,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface BuyerMarketplaceProps {
  buyer: BuyerProfile;
  listings: CropListing[];
  farmerProfiles: Record<string, FarmerProfile>;
  buyerAds: BuyerAd[];
  onAddBuyerAd: (ad: BuyerAd) => void;
  onLockEscrowAndPurchase: (order: OrderRecord) => void;
  language: Language;
  onOpenChatWithFarmer: (farmerName: string) => void;
  onNavigateToLogistics?: () => void;
}

export const BuyerMarketplace: React.FC<BuyerMarketplaceProps> = ({
  buyer,
  listings = [],
  farmerProfiles = {},
  buyerAds = [],
  onAddBuyerAd,
  onLockEscrowAndPurchase,
  language,
  onOpenChatWithFarmer,
  onNavigateToLogistics,
}) => {
  const l = LOCALIZATION[language] || LOCALIZATION["English"];

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState<string>("" );
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("All");
  const [minHonorScore, setMinHonorScore] = useState<number>(80);
  const [organicOnly, setOrganicOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "freshness" | "score">("score");

  // Selected Listing for Farmer Profile Modal & Purchase Modal
  const [selectedListing, setSelectedListing] = useState<CropListing | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showEscrowModal, setShowEscrowModal] = useState<boolean>(false);
  const [procurementQty, setProcurementQty] = useState<number>(20);
  const [escrowSuccessMsg, setEscrowSuccessMsg] = useState<string | null>(null);

  // Reverse Procurement Form State
  const [adCrop, setAdCrop] = useState<string>("Tomatoes");
  const [adVariety, setAdVariety] = useState<string>("Grade-A Hybrid / Processing");
  const [adQty, setAdQty] = useState<number>(50);
  const [adRate, setAdRate] = useState<number>(28);
  const [adLocation, setAdLocation] = useState<string>("Mumbai Central Mandi Yard #4");
  const [adSuccess, setAdSuccess] = useState<string | null>(null);

  // Filter listings
  const filteredListings = (listings || []).filter((item) => {
    if (!item || item.status !== "Available") return false;
    if (selectedCropFilter !== "All" && item.crop !== selectedCropFilter) return false;
    if ((item.farmerHonorScore ?? 100) < minHonorScore) return false;
    if (organicOnly && !item.organicCertified) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (item.crop || "").toLowerCase().includes(q) ||
        (item.variety || "").toLowerCase().includes(q) ||
        (item.farmerName || "").toLowerCase().includes(q) ||
        (item.farmerLocation || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort filtered listings
  filteredListings.sort((a, b) => {
    if (sortBy === "price-asc") return a.ratePerKg - b.ratePerKg;
    if (sortBy === "price-desc") return b.ratePerKg - a.ratePerKg;
    if (sortBy === "freshness") return a.freshnessShelfDays - b.freshnessShelfDays;
    return b.farmerHonorScore - a.farmerHonorScore;
  });

  // Handle Post Reverse Ad
  const handlePostAd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAd: BuyerAd = {
      id: `AD-${Math.floor(100 + Math.random() * 900)}`,
      crop: adCrop,
      variety: adVariety,
      required_qty_qtl: Number(adQty),
      offered_rate: Number(adRate),
      buyer_name: buyer.name,
      deliveryLocation: adLocation,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      bidsReceived: 0,
    };
    onAddBuyerAd(newAd);
    setAdSuccess(`Procurement Requirement #${newAd.id} published to all registered farmers!`);
    setTimeout(() => setAdSuccess(null), 5000);
  };

  // Confirm Purchase & Lock Escrow
  const confirmEscrowPurchase = () => {
    if (!selectedListing) return;

    const qtyToBuy = procurementQty;
    const cropTotal = qtyToBuy * selectedListing.ratePerKg * 100;
    const logisticsFee = 3200; // Reefer transport flat rate
    const escrowFee = Math.round(cropTotal * 0.005);
    const grandTotal = cropTotal + logisticsFee + escrowFee;

    const newOrderId = `ORD-${Math.floor(9900 + Math.random() * 99)}`;
    const newOrder: OrderRecord = {
      order_id: newOrderId,
      listing_id: selectedListing.id,
      farmer_id: selectedListing.farmerId,
      farmer_name: selectedListing.farmerName,
      farmer_phone: "+91 98234-56789",
      buyer_name: buyer.name,
      crop: selectedListing.crop,
      qty: qtyToBuy,
      ratePerKg: selectedListing.ratePerKg,
      amount: grandTotal,
      status: "Logistics Assigned",
      escrowStatus: "Escrow Locked",
      progress: 25,
      origin: selectedListing.farmerLocation,
      destination: "Mumbai Central Mandi Hub, Yard #4",
      current_location: "Pickup Reefer Truck Dispatched to Farm Gate",
      eta: "3.5 Hours (Today)",
      driver_name: "Ramesh Express Cold Logistics",
      driver_phone: "+91 99887-11223",
      vehicle_no: "MH-04-AZ-8812 (GPS Monitored Reefer)",
      temperature_celsius: 12.0,
      checkpoints: [
        {
          title: "Escrow Locked & Smart Contract Created",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          location: "Smart KrishiDirect Nodal Account",
          completed: true,
          note: `₹${grandTotal.toLocaleString("en-IN")} locked in escrow security vault.`,
        },
        {
          title: "Logistics Carrier Dispatched",
          time: "Just Now",
          location: selectedListing.farmerLocation,
          completed: true,
          note: "Cold Reefer truck assigned with driver Vikram Singh.",
        },
        {
          title: "Farm Gate Loading & Weighbridge Scan",
          time: "Pending",
          location: "Farmer Farm Gate",
          completed: false,
          note: "Driver will verify batch weight before departure.",
        },
        {
          title: "Mandi Arrival & Buyer QR Verification",
          time: "Pending",
          location: "Mumbai Central Mandi Yard #4",
          completed: false,
          note: "Escrow automatically settles to farmer bank upon QR clearance.",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    onLockEscrowAndPurchase(newOrder);
    setShowEscrowModal(false);
    setEscrowSuccessMsg(
      `✅ Success! Order #${newOrderId} confirmed. ₹${grandTotal.toLocaleString("en-IN")} locked in RBI-regulated escrow. GPS live tracker active.`
    );
  };

  const activeFarmer = selectedListing
    ? farmerProfiles[selectedListing.farmerId] || {
        id: selectedListing.farmerId,
        name: selectedListing.farmerName,
        phone: "+91 98234-56789",
        aadhaarMasked: "XXXX-XXXX-1234",
        kycVerified: true,
        deviceId: "DEV-88902-X9",
        location: selectedListing.farmerLocation,
        state: "Maharashtra",
        honorScore: selectedListing.farmerHonorScore,
        totalOrders: 24,
        positiveReviews: 23,
        memberSince: "Oct 2023",
        bankAccountLinked: true,
        avatar: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200&auto=format&fit=crop&q=80",
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Buyer Portal Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{buyer.name}</h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                GST Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span>Company: <strong className="text-slate-700 dark:text-slate-300">{buyer.company}</strong></span>
              <span>•</span>
              <span>GSTIN: <strong className="font-mono text-slate-700 dark:text-slate-300">{buyer.gstin}</strong></span>
              <span>•</span>
              <span>Hub: <strong className="text-slate-700 dark:text-slate-300">{buyer.location}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 text-center min-w-[130px]">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Escrow Liquidity
            </span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              ₹{buyer.escrowBalance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Fulfilled Deals
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {buyer.totalPurchases}
            </span>
          </div>
        </div>
      </div>

      {escrowSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs md:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{escrowSuccessMsg}</span>
          </div>
          <button
            onClick={() => setEscrowSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:text-emerald-900 dark:hover:text-white text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Logistics & Fleet Connect Banner */}
      {onNavigateToLogistics && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Direct-from-Farm Transport Logistics & Reefer Fleet</span>
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 text-[10px] font-bold rounded-full border border-blue-400/30">
                  Instant Dispatch
                </span>
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Contact verified local drivers, calculate live freight per KM, or book temperature-controlled reefer pickup to your warehouse.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToLogistics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 shrink-0 cursor-pointer transition-all hover:scale-105"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>View & Book Logistics Fleet ➔</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-colors">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search crop name, variety, farm location, or farmer name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Crop Filter */}
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800"
          >
            <option value="All" className="dark:bg-slate-800">All Crops</option>
            <option value="Tomatoes" className="dark:bg-slate-800">Tomatoes</option>
            <option value="Onions" className="dark:bg-slate-800">Onions</option>
            <option value="Potatoes" className="dark:bg-slate-800">Potatoes</option>
            <option value="Wheat" className="dark:bg-slate-800">Wheat</option>
            <option value="Mustard" className="dark:bg-slate-800">Mustard</option>
            <option value="Cotton" className="dark:bg-slate-800">Cotton</option>
            <option value="Rice" className="dark:bg-slate-800">Rice</option>
          </select>

          {/* Min Honor Score Filter */}
          <select
            value={minHonorScore}
            onChange={(e) => setMinHonorScore(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800"
          >
            <option value={50} className="dark:bg-slate-800">Honor Score: 50+ (All)</option>
            <option value={70} className="dark:bg-slate-800">Honor Score: 70+ (Verified)</option>
            <option value={85} className="dark:bg-slate-800">Honor Score: 85+ (Top Tier)</option>
            <option value={95} className="dark:bg-slate-800">Honor Score: 95+ (Elite 5★)</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800"
          >
            <option value="score" className="dark:bg-slate-800">Sort: Farmer Honor Score</option>
            <option value="price-asc" className="dark:bg-slate-800">Sort: Price (Low to High)</option>
            <option value="price-desc" className="dark:bg-slate-800">Sort: Price (High to Low)</option>
            <option value="freshness" className="dark:bg-slate-800">Sort: Harvest Freshness</option>
          </select>

          {/* Organic Filter Toggle */}
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              organicOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            🌱 Organic Only
          </button>
        </div>
      </div>

      {/* Main Grid: Harvest Catalog (Left 8 Cols) & Reverse Ads / Quick Demand (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Harvest Listings Catalog */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🌾 Live Farmer Harvest Lots</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({filteredListings.length} available batches)
              </span>
            </h2>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Direct-from-Farm Gate
            </span>
          </div>

          {filteredListings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No produce listings match the selected filters.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try lowering the Honor Score threshold or clearing the crop filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Produce Image with Badges */}
                    <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.crop}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                          #{item.id}
                        </span>
                        {item.organicCertified && (
                          <span className="px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                            🌱 Organic
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-slate-900 dark:text-white text-xs font-extrabold rounded-lg shadow-sm">
                          ₹{item.ratePerKg.toFixed(2)} / kg
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-950/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-white text-[11px]">
                        <span className="font-semibold text-emerald-300">
                          {item.qtyQuintals} Quintals ({item.qtyQuintals * 100} kg)
                        </span>
                        <span className="text-slate-300">
                          Shelf: ~{item.freshnessShelfDays} days
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {item.crop}
                          </h3>
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {item.qualityGrade.split(" ")[0]} {item.qualityGrade.split(" ")[1]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                          {item.variety}
                        </p>
                      </div>

                      {/* Farmer Trust Summary */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                            👨‍🌾
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block leading-tight">
                              {item.farmerName}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              📍 {item.farmerLocation.split(",")[0]}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {item.farmerHonorScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Packaging specification */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span>📦 Packaging:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.packagingType}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedListing(item);
                        setShowProfileModal(true);
                      }}
                      className="py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Trust Card</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedListing(item);
                        setProcurementQty(item.qtyQuintals);
                        setShowEscrowModal(true);
                      }}
                      className="py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Escrow</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Reverse Procurement Ads (Post Demand & View Active Demands) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Post Reverse Ad Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Post Demand Tender (Ad)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Farmers can submit instant delivery bids</p>
              </div>
            </div>

            {adSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{adSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePostAd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Crop Required *
                </label>
                <select
                  value={adCrop}
                  onChange={(e) => setAdCrop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Tomatoes" className="dark:bg-slate-800">Tomatoes</option>
                  <option value="Onions" className="dark:bg-slate-800">Onions</option>
                  <option value="Potatoes" className="dark:bg-slate-800">Potatoes</option>
                  <option value="Wheat" className="dark:bg-slate-800">Wheat</option>
                  <option value="Mustard" className="dark:bg-slate-800">Mustard</option>
                  <option value="Cotton" className="dark:bg-slate-800">Cotton</option>
                  <option value="Rice" className="dark:bg-slate-800">Rice</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Variety / Specification
                </label>
                <input
                  type="text"
                  value={adVariety}
                  onChange={(e) => setAdVariety(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Qty (Qtl) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={adQty}
                    onChange={(e) => setAdQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offered Rate (₹/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={adRate}
                    onChange={(e) => setAdRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Mandi / Hub
                </label>
                <input
                  type="text"
                  value={adLocation}
                  onChange={(e) => setAdLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Publish Procurement Tender
              </button>
            </form>
          </div>

          {/* Active Demand Ads List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Active Procurement Ads</h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                {buyerAds.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {buyerAds.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{ad.crop}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ₹{ad.offered_rate}/kg
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ad.variety}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Target: <strong className="text-slate-700 dark:text-slate-200">{ad.required_qty_qtl} Quintals</strong></span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      📩 {ad.bidsReceived} Farmer Bids
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: View Farmer Profile & Trust Card */}
      {showProfileModal && selectedListing && activeFarmer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Verified Farmer Trust Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Farmer Header Info */}
              <div className="flex items-center gap-4 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/60">
                <img
                  src={activeFarmer.avatar}
                  alt={activeFarmer.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{activeFarmer.name}</h4>
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    📍 {activeFarmer.location}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[10px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Aadhaar e-KYC Certified
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                      Bank Linked
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Score & Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Honor Score
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                    {activeFarmer.honorScore} / 100
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Fulfillment Rate
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {activeFarmer.totalOrders > 0
                      ? `${Math.round((activeFarmer.positiveReviews / activeFarmer.totalOrders) * 100)}%`
                      : "100%"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Dispatches
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {activeFarmer.totalOrders}
                  </span>
                </div>
              </div>

              {/* Hardware Device Fingerprint & Security Details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    Registered Hardware Device ID:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeFarmer.deviceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Aadhaar Card Reference:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{activeFarmer.aadhaarMasked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Member Reputation:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Zero Default History</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onOpenChatWithFarmer(activeFarmer.name);
                  }}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl font-semibold cursor-pointer"
                >
                  💬 Start Negotiation Chat
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setProcurementQty(selectedListing.qtyQuintals);
                    setShowEscrowModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Proceed to Escrow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Lock Escrow & Confirm Purchase */}
      {showEscrowModal && selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {l.lock_escrow}
              </h3>
              <button
                onClick={() => setShowEscrowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>
                    {selectedListing.crop} ({selectedListing.variety})
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">₹{selectedListing.ratePerKg}/kg</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Origin: {selectedListing.farmerLocation} ➔ Destination: Mumbai Central Mandi Hub
                </p>
              </div>

              {/* Quantity Slider / Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Procurement Quantity (Quintals):
                  </label>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {procurementQty} Qtl ({procurementQty * 100} kg)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={selectedListing.qtyQuintals}
                  value={procurementQty}
                  onChange={(e) => setProcurementQty(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Escrow Financial Breakdown */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Produce Value ({procurementQty * 100} kg × ₹{selectedListing.ratePerKg}):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ₹{(procurementQty * selectedListing.ratePerKg * 100).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>GPS Reefer Logistics Carrier:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">₹3,200</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Smart KrishiDirect Escrow Assurance (0.5%):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ₹{Math.round(procurementQty * selectedListing.ratePerKg * 100 * 0.005).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Total Escrow Amount to Lock:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-base">
                    ₹{(
                      procurementQty * selectedListing.ratePerKg * 100 +
                      3200 +
                      Math.round(procurementQty * selectedListing.ratePerKg * 100 * 0.005)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Escrow Guarantee Notice */}
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-200 text-[11px] leading-relaxed">
                <p className="font-semibold flex items-center gap-1 mb-0.5 text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  Tri-Party Escrow Smart Contract Guarantee:
                </p>
                Funds remain safely held in an RBI-compliant nodal account. Payment is auto-transferred to the farmer only after the Mandi QR quality handover is cleared.
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEscrowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEscrowPurchase}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm & Lock Escrow</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
