import React, { useState } from "react";
import {
  Truck,
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Snowflake,
  Filter,
  Search,
  ExternalLink,
  Package,
  Navigation,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Check,
  X,
} from "lucide-react";
import {
  DeliveryPartner,
  DeliveryBookingRequest,
  UserRole,
  FarmerProfile,
  BuyerProfile,
  Language,
  VehicleCategory,
} from "../types";
import { LOCALIZATION } from "../data/localization";

interface DeliveryPartnerHubProps {
  deliveryPartners?: DeliveryPartner[];
  partners?: DeliveryPartner[];
  bookings?: DeliveryBookingRequest[];
  existingBookings?: DeliveryBookingRequest[];
  onBookDelivery: (booking: DeliveryBookingRequest) => void;
  currentRole: UserRole;
  farmer?: FarmerProfile;
  buyer?: BuyerProfile;
  userName?: string;
  userPhone?: string;
  userLocation?: string;
  language: Language;
}

export const DeliveryPartnerHub: React.FC<DeliveryPartnerHubProps> = ({
  deliveryPartners,
  partners,
  bookings,
  existingBookings,
  onBookDelivery,
  currentRole,
  farmer,
  buyer,
  userName,
  userPhone,
  userLocation,
  language,
}) => {
  const l = LOCALIZATION[language] || LOCALIZATION["English"];

  const partnerList = deliveryPartners || partners || [];
  const bookingList = bookings || existingBookings || [];

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyColdChain, setOnlyColdChain] = useState(false);

  // Booking Modal State
  const [bookingModalPartner, setBookingModalPartner] = useState<DeliveryPartner | null>(null);
  const [callModalPartner, setCallModalPartner] = useState<DeliveryPartner | null>(null);
  const [successBooking, setSuccessBooking] = useState<DeliveryBookingRequest | null>(null);

  // Booking Form State
  const [pickupLocation, setPickupLocation] = useState(
    userLocation ||
      (currentRole === "farmer"
        ? farmer?.location || "Dindori Road Farm, Nashik, Maharashtra"
        : "Nashik APMC Aggregation Yard")
  );
  const [dropLocation, setDropLocation] = useState(
    currentRole === "buyer"
      ? buyer?.location || "Mumbai Central Mandi Yard #4"
      : "Vashi APMC Wholesale Terminal, Navi Mumbai"
  );
  const [crop, setCrop] = useState("Tomatoes (Grade A)");
  const [quantityQuintals, setQuantityQuintals] = useState<number>(25);
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split("T")[0]);
  const [pickupTime, setPickupTime] = useState("06:30 AM (Early Morning Harvest)");
  const [distanceKm, setDistanceKm] = useState<number>(170);
  const [paymentMethod, setPaymentMethod] = useState<
    "Escrow Transport Lock" | "Pay on Delivery (Cash/UPI)" | "Advance 50%"
  >("Escrow Transport Lock");
  const [specialNotes, setSpecialNotes] = useState(
    "Please bring clean tarpaulin sheets and ensure careful loading."
  );

  // Filter Partners
  const filteredPartners = (partnerList || []).filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.operatingHub.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.currentLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedVehicleType === "ALL" || partner.vehicleType === selectedVehicleType;

    const matchesAvailable = !onlyAvailable || partner.status === "Available Now";
    const matchesCold = !onlyColdChain || partner.temperatureControlled;

    return matchesSearch && matchesType && matchesAvailable && matchesCold;
  });

  // Calculate estimated freight fare
  const calculateFare = (partner: DeliveryPartner, km: number) => {
    const base = partner.fixedBaseFare;
    const distanceCost = km * partner.baseRatePerKm;
    const coldChainCost = partner.temperatureControlled ? 500 : 0;
    return base + distanceCost + coldChainCost;
  };

  const handleOpenBooking = (partner: DeliveryPartner) => {
    setBookingModalPartner(partner);
    setSpecialNotes(
      partner.temperatureControlled
        ? "Maintain reefer temperature at 10°C-14°C throughout transport."
        : "Please bring clean tarpaulin sheets and ensure careful loading."
    );
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalPartner) return;

    const totalFare = calculateFare(bookingModalPartner, distanceKm);
    const bookingRef = `KRISHI-LOG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: DeliveryBookingRequest = {
      id: `BKG-${Date.now()}`,
      bookingRef,
      partnerId: bookingModalPartner.id,
      partnerName: bookingModalPartner.name,
      partnerPhone: bookingModalPartner.phone,
      vehicleNo: bookingModalPartner.vehicleNo,
      vehicleType: bookingModalPartner.vehicleType,
      requesterRole: currentRole === "buyer" ? "buyer" : "farmer",
      requesterName:
        currentRole === "buyer"
          ? buyer?.name || "AgriCorp Procurements"
          : farmer?.name || "Ramesh Kumar",
      requesterPhone:
        currentRole === "buyer"
          ? buyer?.phone || "+91 91122-33445"
          : farmer?.phone || "+91 98234-56789",
      crop,
      quantityQuintals,
      pickupLocation,
      dropLocation,
      pickupDate,
      pickupTime,
      distanceKm,
      estimatedFare: totalFare,
      paymentMethod,
      specialNotes,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
    };

    onBookDelivery(newBooking);
    setSuccessBooking(newBooking);
    setBookingModalPartner(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Agri-Logistics & Delivery Partner Network</span>
                <span className="text-xs px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-full font-bold border border-blue-200 dark:border-blue-800">
                  Verified Fleet
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct farm-gate pickup & interstate mandi transit • Cold-chain reefers, pickups & multi-axle trucks
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Escrow Freight Protection</span>
          </div>
          <div className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 rounded-xl font-semibold border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5">
            <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>IoT Cold Telemetry</span>
          </div>
        </div>
      </div>

      {/* Booking Success Alert */}
      {successBooking && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs md:text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                🎉 Logistics Booking Confirmed! Docket #{successBooking.bookingRef}
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Driver <strong>{successBooking.partnerName}</strong> ({successBooking.vehicleNo}) assigned. Pickup: {successBooking.pickupDate} ({successBooking.pickupTime}) • Total Fare: ₹{successBooking.estimatedFare.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${successBooking.partnerPhone}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Driver</span>
            </a>
            <button
              onClick={() => setSuccessBooking(null)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active Bookings Bar if any */}
      {bookingList && bookingList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Your Active Logistics Bookings ({bookingList.length})</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Live Telemetry & Driver Contacts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bookingList.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        {b.bookingRef}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded text-[10px] font-bold">
                        {b.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {b.partnerName} • <span className="text-slate-500 font-mono">{b.vehicleNo}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      ₹{b.estimatedFare.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{b.paymentMethod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pickup Origin:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                      {b.pickupLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destination:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                      {b.dropLocation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    📦 {b.quantityQuintals} Qtl of {b.crop}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${b.partnerPhone}`}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{b.partnerPhone}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search driver name, location corridor (Nashik, Mumbai, Pune, Delhi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Toggle Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                onlyAvailable
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Available Now</span>
            </button>

            <button
              onClick={() => setOnlyColdChain(!onlyColdChain)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                onlyColdChain
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Cold Reefer Only</span>
            </button>
          </div>
        </div>

        {/* Vehicle Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Vehicles" },
            { id: "Reefer Cold Chain (Temperature Controlled)", label: "❄️ Reefer Cold-Chain" },
            { id: "Mini Pickup (Tata Ace / Bolero)", label: "🛻 Mini Pickup (15 Qtl)" },
            { id: "Medium Truck (14ft / 17ft Eicher)", label: "🚚 Medium Truck (80 Qtl)" },
            { id: "Heavy Multi-Axle (10-Ton / 16-Ton)", label: "🚛 Heavy Multi-Axle (160 Qtl)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedVehicleType(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-colors ${
                selectedVehicleType === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-4 group"
          >
            {/* Top Card Section */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-100 dark:ring-blue-900/40"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                      {partner.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                      {partner.vehicleNo}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    partner.status === "Available Now"
                      ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  ● {partner.status}
                </span>
              </div>

              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-200 dark:border-amber-800">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {partner.rating} ({partner.totalTrips} trips)
                </span>

                <span className="bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold border border-blue-200 dark:border-blue-800">
                  Max: {partner.capacityQuintals} Quintals
                </span>

                {partner.temperatureControlled && (
                  <span className="bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-cyan-200 dark:border-cyan-800">
                    <Snowflake className="w-3 h-3" />
                    Cold Reefer (4-15°C)
                  </span>
                )}
              </div>

              {/* Location & Operating Corridor */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Hub: {partner.operatingHub}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Current: {partner.currentLocation}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                  <span className="text-slate-500">ETA to Farm: ~{partner.estimatedEtaMins} mins</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> DL & Insurance Verified
                  </span>
                </div>
              </div>

              {/* Pricing & Languages */}
              <div className="flex items-center justify-between text-xs px-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Rate:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    ₹{partner.baseRatePerKm}
                  </strong>
                  <span className="text-[10px] text-slate-500"> / km + ₹{partner.fixedBaseFare}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Languages:</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    {partner.languages.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                id={`call-partner-${partner.id}`}
                onClick={() => setCallModalPartner(partner)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Contact Driver</span>
              </button>

              <button
                id={`book-partner-${partner.id}`}
                onClick={() => handleOpenBooking(partner)}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Avail & Book</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Contact / Phone Modal */}
      {callModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Contact Logistics Partner
                  </h3>
                  <span className="text-[11px] text-slate-500">{callModalPartner.name}</span>
                </div>
              </div>
              <button
                onClick={() => setCallModalPartner(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900 dark:text-white">{callModalPartner.vehicleNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Capacity:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {callModalPartner.capacityQuintals} Quintals
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Driver Phone:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {callModalPartner.phone}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={`tel:${callModalPartner.phone}`}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Driver Directly ({callModalPartner.phone})</span>
              </a>

              <a
                href={`https://wa.me/${callModalPartner.whatsappPhone?.replace(/[^0-9]/g, "") || "919890144552"}?text=${encodeURIComponent(`Hello ${callModalPartner.name}, I found your vehicle ${callModalPartner.vehicleNo} on Smart KrishiDirect. I need transport service for my agricultural produce.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat via WhatsApp / SMS Dispatch</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Avail Services & Booking Modal */}
      {bookingModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Avail & Book Transport Logistics</h3>
                  <p className="text-xs text-blue-100">
                    Partner: {bookingModalPartner.name} • {bookingModalPartner.vehicleNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingModalPartner(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 text-xs">
              {/* Origin and Destination */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    📍 Pickup Location (Farm / Aggregation Yard) *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    🏁 Drop Destination (Mandi Yard / Warehouse / Port) *
                  </label>
                  <input
                    type="text"
                    required
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Crop & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crop Produce *
                  </label>
                  <input
                    type="text"
                    required
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Load Quantity (Quintals) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={bookingModalPartner.capacityQuintals}
                    value={quantityQuintals}
                    onChange={(e) => setQuantityQuintals(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Max capacity: {bookingModalPartner.capacityQuintals} Qtl
                  </span>
                </div>
              </div>

              {/* Pickup Date & Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pickup Date & Slot *
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Transit Distance (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={2000}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Freight Payment Mechanism *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Escrow Transport Lock">
                    🔒 Escrow Transport Lock (Held securely until verified delivery)
                  </option>
                  <option value="Pay on Delivery (Cash/UPI)">
                    💵 Pay on Delivery at Mandi Gate (Cash / UPI)
                  </option>
                  <option value="Advance 50%">
                    ⚡ 50% Advance via Bank / 50% on Unloading
                  </option>
                </select>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Special Instructions / Crate Handling
                </label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Bring extra ropes, maintain reefer at 12°C"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Fare Calculation Summary Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Base Booking Charge:</span>
                  <span>₹{bookingModalPartner.fixedBaseFare}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>
                    Distance Charge ({distanceKm} km × ₹{bookingModalPartner.baseRatePerKm}/km):
                  </span>
                  <span>₹{distanceKm * bookingModalPartner.baseRatePerKm}</span>
                </div>
                {bookingModalPartner.temperatureControlled && (
                  <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400">
                    <span>Reefer Cold-Chain Handling:</span>
                    <span>+₹500</span>
                  </div>
                )}
                <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between font-extrabold text-slate-900 dark:text-white text-sm">
                  <span>Total Estimated Freight Fare:</span>
                  <span className="text-blue-700 dark:text-blue-400 text-base">
                    ₹{calculateFare(bookingModalPartner, distanceKm).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setBookingModalPartner(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="confirm-booking-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Logistics Booking & Generate Docket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
