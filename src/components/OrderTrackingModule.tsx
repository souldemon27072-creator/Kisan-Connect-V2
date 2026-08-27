import React, { useState } from "react";
import { OrderRecord, Language, UserRole } from "../types";
import { LOCALIZATION } from "../data/localization";
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Thermometer,
  FileCheck,
  Building,
  Navigation,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Award,
} from "lucide-react";

interface OrderTrackingModuleProps {
  orders: OrderRecord[];
  onAdvanceOrderStatus?: (orderId: string) => void;
  currentRole: UserRole;
  language: Language;
}

export const OrderTrackingModule: React.FC<OrderTrackingModuleProps> = ({
  orders,
  onAdvanceOrderStatus,
  currentRole,
  language,
}) => {
  const l = LOCALIZATION[language];
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.order_id || ""
  );

  const currentOrder =
    orders.find((o) => o.order_id === selectedOrderId) || orders[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-emerald-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{l.track_tab}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time GPS telemetry, reefer temperature, and smart contract escrow settlement
          </p>
        </div>

        {/* Order Selector Tab Pills */}
        {orders.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {orders.map((ord) => (
              <button
                key={ord.order_id}
                onClick={() => setSelectedOrderId(ord.order_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedOrderId === ord.order_id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                #{ord.order_id} ({ord.crop})
              </button>
            ))}
          </div>
        )}
      </div>

      {!currentOrder ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active shipments in transit.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orders will automatically appear here once locked in escrow.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Shipment Status Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-800 p-6 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    Order #{currentOrder.order_id}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                    {currentOrder.status}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-800">
                    {currentOrder.escrowStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Produce: <strong className="text-slate-700 dark:text-slate-200">{currentOrder.crop} ({currentOrder.qty} Quintals / {currentOrder.qty * 100} kg)</strong> • Total Escrow: <strong className="text-slate-700 dark:text-slate-200">₹{currentOrder.amount.toLocaleString("en-IN")}</strong>
                </p>
              </div>

              {/* Driver Simulation Advance Button (Helpful for demos) */}
              {onAdvanceOrderStatus && (
                <button
                  onClick={() => onAdvanceOrderStatus(currentOrder.order_id)}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shadow-xs active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
                  <span>Advance Transit Milestone (Demo)</span>
                </button>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Transit Progress: {currentOrder.progress}%</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  ETA: {currentOrder.eta}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${currentOrder.progress}%` }}
                />
              </div>
            </div>

            {/* Info Metrics Grid: Route, Carrier, Location & Cold-Chain Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                  Route Origin & Destination
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                  📍 {currentOrder.origin}
                </p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                  🏁 {currentOrder.destination}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                  Live GPS Checkpoint
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">
                  {currentOrder.current_location}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Live ping updated 2 mins ago</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                  Assigned Cold Reefer Carrier
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-1 flex items-center justify-between">
                  <span>{currentOrder.driver_name}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                  🚛 {currentOrder.vehicle_no}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block font-semibold">
                  Cold Chain Telemetry
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  <Thermometer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{currentOrder.temperature_celsius ?? 14.5}°C</span>
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">(Optimal)</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Humidity: 88% Controlled</span>
              </div>
            </div>
          </div>

          {/* Stepper Timeline & Smart Contract Escrow Release Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Timeline Stepper (Left 8 Cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-emerald-100 dark:border-slate-800 transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 mb-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verification Checkpoint Stepper</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {currentOrder.checkpoints.map((cp, idx) => (
                  <div key={idx} className="relative group text-xs">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors ${
                        cp.completed
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-4 ring-slate-100 dark:ring-slate-800"
                      }`}
                    >
                      {cp.completed ? "✓" : idx + 1}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-bold text-xs ${
                            cp.completed ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {cp.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {cp.time}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        📍 {cp.location}
                      </p>

                      {cp.note && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mt-2">
                          {cp.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Contract Escrow Lock Box (Right 4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-emerald-800/60 text-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-emerald-800/80">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">
                    Escrow Protection Mechanism
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Locked Amount:</span>
                    <span className="font-bold text-white text-sm">
                      ₹{currentOrder.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Smart Contract State:</span>
                    <span className="font-semibold text-emerald-300">
                      {currentOrder.escrowStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Beneficiary:</span>
                    <span className="text-slate-200">{currentOrder.farmer_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Release Condition:</span>
                    <span className="text-emerald-300 font-medium">Mandi QR Scan Clearance</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/50 text-[11px] text-emerald-200 leading-relaxed">
                  Upon arrival at Mumbai Central Mandi Yard #4, the buyer scans the shipment QR to release ₹{currentOrder.amount.toLocaleString("en-IN")} directly to Ramesh Kumar's linked bank account via instant IMPS settlement.
                </div>
              </div>

              {/* Driver Direct Contact Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs text-xs space-y-3 transition-colors">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Driver Contact & Support</span>
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{currentOrder.driver_name}</p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{currentOrder.driver_phone}</p>
                  </div>
                  <a
                    href={`tel:${currentOrder.driver_phone}`}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    Call Driver
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
