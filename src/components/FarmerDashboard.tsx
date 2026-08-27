import React, { useState } from "react";
import {
  FarmerProfile,
  CropListing,
  Language,
  CancellationClaim,
} from "../types";
import { LOCALIZATION } from "../data/localization";
import { APMC_BENCHMARKS } from "../data/mockData";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  Package,
  Calendar,
  IndianRupee,
  Clock,
  ShieldCheck,
  Smartphone,
  Trash2,
  Send,
  Upload,
  ArrowRight,
  Info,
  Layers,
  Sparkle,
  Flame,
  Mic,
  Truck,
  Phone,
  Volume2,
} from "lucide-react";
import { VoiceCropAssistantModal } from "./VoiceCropAssistantModal";

interface FarmerDashboardProps {
  farmer: FarmerProfile;
  listings: CropListing[];
  onAddListing: (listing: CropListing) => void;
  onRequestCancellation: (claim: CancellationClaim) => void;
  language: Language;
  onNavigateToTab: (tab: string) => void;
  bannedDevices?: string[];
  onUpdateFarmer?: (updates: Partial<FarmerProfile>) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  farmer,
  listings = [],
  onAddListing,
  onRequestCancellation,
  language,
  onNavigateToTab,
  bannedDevices = [],
  onUpdateFarmer,
}) => {
  const l = LOCALIZATION[language] || LOCALIZATION["English"];
  const isBanned =
    (bannedDevices || []).includes(farmer?.deviceId || "") ||
    (farmer?.honorScore ?? 100) < 50;
  const isBulkDisabled = (farmer?.honorScore ?? 100) < 70;

  // Voice Assistant Modal State
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // Form State
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomatoes");
  const [variety, setVariety] = useState<string>("Hybrid Grade-A Abhinav");
  const [quantity, setQuantity] = useState<number>(20);
  const [chosenRate, setChosenRate] = useState<number>(28.0);
  const [harvestDate, setHarvestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [qualityGrade, setQualityGrade] = useState<
    "Grade A (Export / Supermarket)" | "Grade B (Standard Mandi)" | "Grade C (Processing)"
  >("Grade A (Export / Supermarket)");
  const [packaging, setPackaging] = useState<string>("25kg Plastic Crates (Ventilated)");
  const [organicCertified, setOrganicCertified] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
  );
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // AI Pricing Advisor State
  const [loadingAiPrice, setLoadingAiPrice] = useState<boolean>(false);
  const [aiPriceData, setAiPriceData] = useState<{
    apmcBaseModal: number;
    minRange: number;
    maxRange: number;
    suggestedRate: number;
    trend: string;
    shelfLife: string;
    marketInsight: string;
    pricingStrategy: string;
  } | null>({
    apmcBaseModal: 25.0,
    minRange: 22.0,
    maxRange: 32.0,
    suggestedRate: 28.5,
    trend: "Bullish (+6.5% week-on-week demand)",
    shelfLife: "5 to 7 days without cold chain",
    marketInsight:
      "High wholesale demand in Mumbai and Pune mandis. Direct-to-buyer bypasses 8.5% middleman commission.",
    pricingStrategy:
      "Listing at ₹28.50/kg captures optimal margin while remaining 10% below retail wholesale landing cost.",
  });

  // Cancellation Modal State
  const [cancelModalListing, setCancelModalListing] = useState<CropListing | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);

  // Variety Auto-Fill Map
  const VARIETIES_MAP: Record<string, string[]> = {
    Tomatoes: ["Hybrid Grade-A Abhinav", "Vaishnavi 303", "Pusa Ruby", "Roma Processing"],
    Potatoes: ["Kufri Jyoti (Uniform Table)", "Kufri Chipsona-1 (Processing)", "Kufri Pukhraj", "Baby Potato Grade-A"],
    Onions: ["Nashik Red Garwa", "Pusa Red Medium (45mm+)", "White Onion (Export)", "Agrifound Light Red"],
    Wheat: ["Sharbati Gold MP High-Gluten", "Lokwan Super Wheat", "HD-2967 High Yield", "Kalyan Sona"],
    Mustard: ["Pusa Bold (High Oil 42%)", "Giriraj Mustard", "Varuna T-59", "Black Mustard Seeds"],
    Cotton: ["Bt Cotton Shankar-6 (28mm staple)", "Bunny Bt High-Micronaire", "DCH-32 Extra Long Staple"],
    Rice: ["1121 Extra Long Basmati", "Kolam Wada Rice", "Sona Masoori Raw Grain", "Pusa Basmati 1509"],
    Chilli: ["Guntur Sannam S4 (High Pungency)", "Byadgi Wrinkled Red", "Teja Stemless Chilli", "Kashmiri Mild Red"],
  };

  // Handle Crop Change
  const handleCropChange = (crop: string) => {
    setSelectedCrop(crop);
    const defaultVariety = VARIETIES_MAP[crop]?.[0] || "Standard Grade";
    setVariety(defaultVariety);

    const base = APMC_BENCHMARKS[crop] || { modal: 25, min: 20, max: 30 };
    setChosenRate(base.modal + 3);

    // Trigger AI Advisor update
    fetchAiPricing(crop, qualityGrade, quantity);
  };

  // Fetch AI APMC Pricing from server.ts
  const fetchAiPricing = async (crop: string, grade: string, qty: number) => {
    setLoadingAiPrice(true);
    try {
      const res = await fetch("/api/gemini/pricing-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop,
          location: farmer.location,
          quantity: qty,
          grade,
          harvestDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiPriceData({
          apmcBaseModal: data.apmcBaseModal || 25,
          minRange: data.minRange || 22,
          maxRange: data.maxRange || 32,
          suggestedRate: data.suggestedRate || 28,
          trend: data.trend || "Stable Mandi Inflow",
          shelfLife: data.shelfLife || "7 days",
          marketInsight: data.marketInsight || "Steady buyer inquiries reported.",
          pricingStrategy: data.pricingStrategy || "Fair market direct selling recommended.",
        });
        setChosenRate(data.suggestedRate || 28);
      }
    } catch (e) {
      console.warn("AI Pricing fetch error:", e);
    } finally {
      setLoadingAiPrice(false);
    }
  };

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Voice Assistant Extracted Data
  const handleApplyVoiceData = (
    listingData: Partial<CropListing>,
    farmerUpdates?: Partial<FarmerProfile>
  ) => {
    if (listingData.crop) {
      setSelectedCrop(listingData.crop);
    }
    if (listingData.variety) {
      setVariety(listingData.variety);
    }
    if (listingData.qtyQuintals !== undefined) {
      setQuantity(listingData.qtyQuintals);
    }
    if (listingData.ratePerKg !== undefined) {
      setChosenRate(listingData.ratePerKg);
    }
    if (listingData.harvestDate) {
      setHarvestDate(listingData.harvestDate);
    }
    if (listingData.qualityGrade) {
      setQualityGrade(listingData.qualityGrade as any);
    }
    if (listingData.packagingType) {
      setPackaging(listingData.packagingType);
    }
    if (listingData.organicCertified !== undefined) {
      setOrganicCertified(listingData.organicCertified);
    }
    if (farmerUpdates && onUpdateFarmer) {
      onUpdateFarmer(farmerUpdates);
    }

    setFormSuccess("🎙️ Produce details & pricing auto-filled from your voice input!");

    // Re-fetch AI APMC price advice with extracted parameters
    if (listingData.crop) {
      fetchAiPricing(
        listingData.crop,
        listingData.qualityGrade || qualityGrade,
        listingData.qtyQuintals || quantity
      );
    }
  };

  // Publish Listing
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (isBanned) {
      setFormError(l.banned_msg);
      return;
    }

    if (isBulkDisabled && quantity > 10) {
      setFormError("Honor Score is below 70: Bulk listings (>10 Quintals) are restricted to prevent supply default.");
      return;
    }

    if (chosenRate <= 0 || quantity <= 0) {
      setFormError("Please enter valid quantity and price values.");
      return;
    }

    const newListing: CropListing = {
      id: `LST-${Math.floor(100 + Math.random() * 900)}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerLocation: farmer.location,
      farmerHonorScore: farmer.honorScore,
      crop: selectedCrop,
      variety,
      qtyQuintals: Number(quantity),
      ratePerKg: Number(chosenRate),
      apmcBaseRate: aiPriceData?.apmcBaseModal || 25,
      harvestDate,
      freshnessShelfDays: APMC_BENCHMARKS[selectedCrop]?.freshnessDays || 10,
      qualityGrade,
      status: "Available",
      packagingType: packaging,
      organicCertified,
      imageUrl:
        photoPreview ||
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
    };

    onAddListing(newListing);
    setFormSuccess(`🎉 Harvest successfully listed! Listing ID #${newListing.id} is now live on the Buyer Marketplace.`);
    setTimeout(() => setFormSuccess(null), 6000);
  };

  // Submit Cancellation Request
  const submitCancellation = () => {
    if (!cancelModalListing || !cancelReason.trim()) return;
    setSubmittingCancel(true);

    const claim: CancellationClaim = {
      id: `CLM-${Math.floor(100 + Math.random() * 900)}`,
      farmer_id: farmer.id,
      farmer_name: farmer.name,
      listing_id: cancelModalListing.id,
      crop: cancelModalListing.crop,
      qty: cancelModalListing.qtyQuintals,
      reason: cancelReason,
      date: new Date().toISOString().split("T")[0],
      status: "Pending Audit",
    };

    onRequestCancellation(claim);
    setSubmittingCancel(false);
    setCancelModalListing(null);
    setCancelReason("");
    setFormSuccess("Cancellation request submitted to Ground Representative Audit Dashboard.");
  };

  // Calculate potential direct earning vs APMC
  const totalDirectValue = quantity * chosenRate * 100; // 1 Quintal = 100 Kg
  const totalApmcValue = quantity * (aiPriceData?.apmcBaseModal || chosenRate - 3) * 100;
  const middlemanSaved = Math.max(0, totalDirectValue - totalApmcValue + totalDirectValue * 0.085);

  return (
    <div className="space-y-6">
      {/* Top Farmer Profile & Trust Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <img
            src={farmer.avatar}
            alt={farmer.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{farmer.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {l.kyc_status}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                📍 {farmer.location}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span>Aadhaar: <strong className="font-mono text-slate-700 dark:text-slate-300">{farmer.aadhaarMasked}</strong></span>
              <span>•</span>
              <span>Registered Device: <strong className="font-mono text-slate-700 dark:text-slate-300">{farmer.deviceId}</strong></span>
              <span>•</span>
              <span>Member Since: <strong className="text-slate-700 dark:text-slate-300">{farmer.memberSince}</strong></span>
            </p>
          </div>
        </div>

        {/* Honor Score & Fulfillment Rate Cards */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              {l.honor_label}
            </span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className={`w-5 h-5 ${farmer.honorScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`} />
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{farmer.honorScore}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/100</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-center min-w-[110px]">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Fulfillment
            </span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {farmer.totalOrders > 0
                ? `${Math.round((farmer.positiveReviews / farmer.totalOrders) * 100)}%`
                : "100%"}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-center min-w-[110px] hidden sm:block">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Total Deals
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {farmer.totalOrders}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Publish Form & Active Listings) & Right Column (AI Market Advisor & Quick Tools) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Active Listings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Publish Harvest Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{l.pub_listing}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct marketplace listing with automatic buyer notification
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                id="open-voice-crop-assistant-btn"
                onClick={() => setShowVoiceModal(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🎙️ बोलकर भरें / Voice Auto-Fill</span>
              </button>
            </div>

            {/* Voice Input Highlight Banner */}
            <div className="mb-5 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    Multilingual Voice Assistant
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Speak crop, quantity, and rate in Hindi, Marathi, Punjabi, Gujarati, etc. AI detects language automatically.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 shrink-0 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>Start Speaking</span>
              </button>
            </div>

            {formSuccess && (
              <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-4">
              {/* Crop & Variety Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {l.select_crop} *
                  </label>
                  <select
                    id="crop-select-input"
                    value={selectedCrop}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {Object.keys(APMC_BENCHMARKS).map((crop) => (
                      <option key={crop} value={crop} className="dark:bg-slate-800">
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Variety *
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Hybrid Grade-A Abhinav"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Quantity, Quality Grade & Harvest Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {l.qty_qtl} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={isBulkDisabled ? 10 : 500}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuantity(val);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {isBulkDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                      Max 10 Qtl allowed (Honor score &lt;70)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quality Grade *
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => {
                      const grade = e.target.value as any;
                      setQualityGrade(grade);
                      fetchAiPricing(selectedCrop, grade, quantity);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Grade A (Export / Supermarket)" className="dark:bg-slate-800">Grade A (Export/Supermarket)</option>
                    <option value="Grade B (Standard Mandi)" className="dark:bg-slate-800">Grade B (Standard Mandi)</option>
                    <option value="Grade C (Processing)" className="dark:bg-slate-800">Grade C (Processing/Juice)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {l.harvest_date}
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Price per Kg & Calculated Earnings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {l.set_price} *
                    </label>
                    {aiPriceData && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        APMC Base: ₹{aiPriceData.apmcBaseModal}/kg
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={chosenRate}
                      onChange={(e) => setChosenRate(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-700 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Packaging Specification
                  </label>
                  <select
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  >
                    <option value="25kg Plastic Crates (Ventilated)" className="dark:bg-slate-800">25kg Plastic Crates (Ventilated)</option>
                    <option value="50kg Jute Mesh Bags" className="dark:bg-slate-800">50kg Jute Mesh Bags</option>
                    <option value="40kg Gunny Sacks" className="dark:bg-slate-800">40kg Gunny Sacks</option>
                    <option value="50kg HDPE Poly Bags" className="dark:bg-slate-800">50kg HDPE Poly Bags</option>
                    <option value="Bulk Loose Tipper (Truckload)" className="dark:bg-slate-800">Bulk Loose Tipper (Truckload)</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Organic Checkbox */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Upload Farm Harvest Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-400"
                    />
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={organicCertified}
                    onChange={(e) => setOrganicCertified(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🌱 Jaivik Bharat / Organic Certified</span>
                </label>
              </div>

              {/* Publish Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isBanned}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isBanned
                      ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-[0.99]"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{l.btn_publish}</span>
                  <span className="ml-1 text-xs opacity-90 font-normal">
                    (Est. Net Total: ₹{totalDirectValue.toLocaleString("en-IN")})
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Listings Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{l.act_listing}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage, track, or cancel live harvest lots</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                {(listings || []).filter((lst) => lst.farmerId === farmer.id).length} Active Lots
              </span>
            </div>

            {(listings || []).filter((lst) => lst.farmerId === farmer.id).length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                No active listings. Publish your first harvest batch above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="py-2.5 px-3">Listing ID</th>
                      <th className="py-2.5 px-3">Crop / Variety</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Rate (₹/kg)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(listings || [])
                      .filter((lst) => lst.farmerId === farmer.id)
                      .map((lst) => (
                        <tr key={lst.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            #{lst.id}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{lst.crop}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {lst.variety}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {lst.qtyQuintals} Qtl
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{lst.ratePerKg.toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                lst.status === "Available"
                                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                                  : lst.status === "In Transit"
                                  ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {lst.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {lst.status === "Available" && (
                              <button
                                onClick={() => setCancelModalListing(lst)}
                                className="px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI APMC Market Advisor & Quick Tools */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Mandi Advisor Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl shadow-lg p-6 border border-emerald-700/40 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  {l.ai_advisor_title}
                </h3>
              </div>
              <button
                onClick={() => fetchAiPricing(selectedCrop, qualityGrade, quantity)}
                disabled={loadingAiPrice}
                className="text-[11px] text-emerald-300 hover:text-white bg-emerald-800/60 px-2.5 py-1 rounded-lg border border-emerald-600/40 transition-colors cursor-pointer"
              >
                {loadingAiPrice ? "Analyzing Mandis..." : "↻ Refresh Feed"}
              </button>
            </div>

            {aiPriceData && (
              <div className="space-y-4 text-xs">
                {/* APMC Benchmarking Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-xl p-3">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">
                      APMC Modal Rate
                    </span>
                    <span className="text-lg font-bold text-white mt-0.5 block">
                      ₹{aiPriceData.apmcBaseModal.toFixed(1)} / kg
                    </span>
                    <span className="text-[10px] text-emerald-400/80">
                      Range: ₹{aiPriceData.minRange} - ₹{aiPriceData.maxRange}
                    </span>
                  </div>

                  <div className="bg-emerald-800/40 border border-emerald-500/50 rounded-xl p-3">
                    <span className="text-[10px] text-emerald-200 uppercase tracking-wider block font-semibold">
                      AI Direct Selling Target
                    </span>
                    <span className="text-lg font-extrabold text-emerald-300 mt-0.5 block">
                      ₹{aiPriceData.suggestedRate.toFixed(1)} / kg
                    </span>
                    <span className="text-[10px] text-emerald-300/90 font-medium">
                      +₹{(aiPriceData.suggestedRate - aiPriceData.apmcBaseModal).toFixed(1)} premium gain
                    </span>
                  </div>
                </div>

                {/* Market Trend & Shelf Life */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Mandi Demand Trend:
                    </span>
                    <span className="font-semibold text-emerald-300">{aiPriceData.trend}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Safe Shelf-Life:
                    </span>
                    <span className="font-semibold text-slate-200">{aiPriceData.shelfLife}</span>
                  </div>
                </div>

                {/* AI Market Insight */}
                <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700/40 text-emerald-200/90 text-[11px] leading-relaxed">
                  <p className="font-medium text-emerald-100 mb-1 flex items-center gap-1">
                    <Sparkle className="w-3 h-3 text-emerald-400" />
                    Marketplace Intelligence:
                  </p>
                  {aiPriceData.marketInsight}
                </div>

                {/* Direct Farmer Profit Comparison Card */}
                <div className="p-3 bg-gradient-to-r from-emerald-900 to-green-950 rounded-xl border border-emerald-600/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">
                      Estimated Middleman Savings
                    </span>
                    <span className="text-base font-extrabold text-emerald-300">
                      +₹{Math.round(middlemanSaved).toLocaleString("en-IN")} Extra Margin
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-lg border border-emerald-400/40">
                    +14.2% Return
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateToTab("chat")}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all hover:shadow-md group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                💬
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{l.chat_tab}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Negotiate directly with verified buyers</p>
            </button>

            <button
              onClick={() => onNavigateToTab("tracking")}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all hover:shadow-md group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                🚚
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{l.track_tab}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">GPS location, temperature & escrow</p>
            </button>

            <button
              onClick={() => onNavigateToTab("logistics")}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 hover:border-blue-500 text-left transition-all hover:shadow-md group cursor-pointer sm:col-span-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    🚚
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Logistics & Delivery Partners</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] rounded-full font-bold">
                        Verified Drivers
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Contact & book reefers, Bolero pickups & multi-axle trucks directly at farm-gate
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab("coldstorage")}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all hover:shadow-md group cursor-pointer sm:col-span-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    🧊
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{l.cold_tab}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Prevent spoilage: reserve slots in Nashik hub</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Crop & Profile AI Assistant Modal */}
      <VoiceCropAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        farmer={farmer}
        onApplyExtractedData={handleApplyVoiceData}
        currentLanguage={language}
      />

      {/* Cancellation Request Modal */}
      {cancelModalListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel Harvest Listing #{cancelModalListing.id}
              </h3>
              <button
                onClick={() => setCancelModalListing(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Ground Audit Notice:
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  To prevent market manipulation and price gouging, all cancellations undergo mandatory verification by the Field Representative.
                  Legitimate weather or spoilage reasons will have penalties waived.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Unseasonal hailstorm damaged harvest in block 4 / transport truck breakdown..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalListing(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitCancellation}
                  disabled={submittingCancel || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {submittingCancel ? "Submitting..." : "Submit to Auditor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
