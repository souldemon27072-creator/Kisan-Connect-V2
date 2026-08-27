import React, { useState } from "react";
import { ColdStorageFacility, Language, ColdStorageBooking } from "../types";
import { LOCALIZATION } from "../data/localization";
import {
  Snowflake,
  MapPin,
  Calendar,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Star,
  Layers,
  Thermometer,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";

interface ColdStorageLocatorProps {
  facilities: ColdStorageFacility[];
  farmerName: string;
  language: Language;
  onBookSlot: (booking: ColdStorageBooking) => void;
}

export const ColdStorageLocator: React.FC<ColdStorageLocatorProps> = ({
  facilities,
  farmerName,
  language,
  onBookSlot,
}) => {
  const l = LOCALIZATION[language];

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    facilities[0]?.id || ""
  );
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomatoes");
  const [quintalsToStore, setQuintalsToStore] = useState<number>(15);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [bookingSuccess, setBookingSuccess] = useState<ColdStorageBooking | null>(
    null
  );

  const selectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  const dailyRate = selectedFacility?.rate_per_day || 15;
  const totalRawCost = quintalsToStore * dailyRate * durationDays;
  const govtSubsidyEstimate = Math.round(totalRawCost * 0.25); // 25% PMKSY Cold Chain Subsidy
  const netFarmerPayable = totalRawCost - govtSubsidyEstimate;

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    const booking: ColdStorageBooking = {
      id: `CS-BK-${Math.floor(1000 + Math.random() * 9000)}`,
      facilityName: selectedFacility.name,
      farmerName,
      crop: selectedCrop,
      qtyQuintals: quintalsToStore,
      durationDays,
      ratePerDay: dailyRate,
      totalCost: netFarmerPayable,
      bookedAt: new Date().toISOString(),
    };

    onBookSlot(booking);
    setBookingSuccess(booking);
    setTimeout(() => setBookingSuccess(null), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>{l.cold_tab}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Prevent distress selling during market gluts • Subsidized solar-powered cold chambers
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 rounded-full border border-cyan-200 dark:border-cyan-800">
          ❄️ 25% PMKSY Govt Subsidy Active
        </span>
      </div>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs md:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              🎉 <strong>Booking Confirmed!</strong> Slip #{bookingSuccess.id} reserved for{" "}
              {bookingSuccess.qtyQuintals} Quintals of {bookingSuccess.crop} at{" "}
              {bookingSuccess.facilityName} ({bookingSuccess.durationDays} days).
            </span>
          </div>
          <button
            onClick={() => setBookingSuccess(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:text-emerald-900 dark:hover:text-white text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Facility Directory (Left 7 Cols) & Slot Reservation Form (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Facilities Directory List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Nearby Verified Cold Storage Warehouses
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Radius: Within 25 km of Nashik</span>
          </div>

          <div className="space-y-4">
            {facilities.map((fac) => {
              const isSelected = fac.id === selectedFacilityId;

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacilityId(fac.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-xs space-y-3 ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-cyan-500 shadow-md ring-2 ring-cyan-400/20"
                      : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{fac.name}</h4>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {fac.rating}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{fac.location}</span>
                        <strong className="text-cyan-700 dark:text-cyan-400 font-bold ml-1">
                          ({fac.distance_km} km away)
                        </strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-cyan-800 dark:text-cyan-400 block">
                        ₹{fac.rate_per_day}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">/ quintal / day</span>
                    </div>
                  </div>

                  {/* Capacity and Climate specs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Available Capacity:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {fac.available_quintals} Qtl / {fac.total_capacity} Qtl
                      </strong>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Chamber Climate:</span>
                      <strong className="text-cyan-800 dark:text-cyan-400">{fac.temperatureRange}</strong>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {fac.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium border border-slate-200/50 dark:border-slate-700/50"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>

                  {/* Footer Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {fac.contactPhone}
                    </span>
                    <button
                      type="button"
                      className={`font-bold transition-colors ${
                        isSelected ? "text-cyan-700 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {isSelected ? "● Currently Selected" : "Select Facility ➔"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slot Reservation Form & Subsidy Calculator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
                <Snowflake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{l.reserve_slot}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target: {selectedFacility?.name || "Select Facility"}
                </p>
              </div>
            </div>

            <form onSubmit={handleReserve} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Produce to Preserve *
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Tomatoes">Tomatoes (5-10°C Chamber)</option>
                  <option value="Potatoes">Potatoes (2-4°C CIPC Chamber)</option>
                  <option value="Onions">Onions (High Ventilation Chamber)</option>
                  <option value="Chilli">Green / Red Chilli</option>
                  <option value="Fruits">Pomegranate / Grapes / Mango</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Quintals) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={100}
                    value={quintalsToStore}
                    onChange={(e) => setQuintalsToStore(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={180}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Standard Storage Rate ({dailyRate} ₹/qtl/day):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">₹{totalRawCost.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>PMKSY Govt Rebate Subsidy (25%):</span>
                  <span>-₹{govtSubsidyEstimate.toLocaleString("en-IN")}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-extrabold text-slate-900 dark:text-white text-sm">
                  <span>Estimated Net Farmer Outlay:</span>
                  <span className="text-cyan-800 dark:text-cyan-400 text-base">
                    ₹{netFarmerPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Preservation Advisory Tip */}
              <div className="p-3 bg-cyan-50/80 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200 text-[11px] leading-relaxed">
                💡 <strong>Harvest Tip:</strong> Storing {quintalsToStore} Quintals of {selectedCrop} for {durationDays} days prevents quality degradation and allows selling when local mandi arrivals reduce next week.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Cold Storage Slot Reservation</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
