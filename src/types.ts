export type UserRole = "farmer" | "buyer" | "auditor" | "driver";

export type Language = "English" | "Hindi" | "Marathi";

export type Theme = "light" | "dark";

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  aadhaarMasked: string;
  kycVerified: boolean;
  deviceId: string;
  location: string;
  state: string;
  honorScore: number;
  totalOrders: number;
  positiveReviews: number;
  memberSince: string;
  bankAccountLinked: boolean;
  avatar?: string;
}

export interface BuyerProfile {
  id: string;
  name: string;
  company: string;
  gstin: string;
  phone: string;
  location: string;
  deviceId: string;
  totalPurchases: number;
  escrowBalance: number;
}

export interface AuditorProfile {
  id: string;
  name: string;
  badgeId: string;
  designation: string;
  department: string;
  jurisdiction: string;
  clearanceLevel: string;
  phone: string;
  email: string;
  mfaEnabled: boolean;
  avatar?: string;
  activeCasesCount: number;
  totalInspections: number;
}

export interface AuthAccount {
  id: string;
  role: UserRole;
  identifier: string; // Phone, Email/GSTIN, or Badge ID
  password: string;
  securityPin?: string; // 4-digit PIN for farmer or 6-digit MFA for auditor
  name: string;
  title: string;
  subtitle: string;
  location: string;
  badgeTag: string;
  avatar?: string;
  farmerProfile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
  auditorProfile?: AuditorProfile;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: AuthAccount | null;
  role: UserRole;
  loginTime: string;
}

export interface CropListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerLocation: string;
  farmerHonorScore: number;
  crop: string;
  variety: string;
  qtyQuintals: number;
  ratePerKg: number;
  apmcBaseRate: number;
  harvestDate: string;
  freshnessShelfDays: number;
  qualityGrade: "Grade A (Export / Supermarket)" | "Grade B (Standard Mandi)" | "Grade C (Processing)";
  status: "Available" | "Reserved" | "In Transit" | "Completed" | "Cancelled";
  imageUrl?: string;
  packagingType: string;
  organicCertified: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: "Farmer" | "Buyer" | "Auditor" | "Driver";
  text: string;
  time: string;
  timestamp: number;
  file?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  offerPrice?: number | null;
}

export interface TrackingCheckpoint {
  title: string;
  time: string;
  location: string;
  completed: boolean;
  note?: string;
}

export interface OrderRecord {
  order_id: string;
  listing_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  buyer_name: string;
  crop: string;
  qty: number;
  ratePerKg: number;
  amount: number;
  status: "Logistics Assigned" | "Picked Up" | "In Transit" | "Arrived at Mandi" | "Completed";
  escrowStatus: "Escrow Locked" | "In Transit Holding" | "Inspection Passed" | "Escrow Released to Farmer";
  progress: number;
  origin: string;
  destination: string;
  current_location: string;
  eta: string;
  driver_name: string;
  driver_phone: string;
  vehicle_no: string;
  temperature_celsius?: number;
  checkpoints: TrackingCheckpoint[];
  createdAt: string;
}

export interface ColdStorageFacility {
  id: string;
  name: string;
  location: string;
  distance_km: number;
  available_quintals: number;
  total_capacity: number;
  rate_per_day: number;
  temperatureRange: string;
  amenities: string[];
  contactPhone: string;
  rating: number;
}

export interface ColdStorageBooking {
  id: string;
  facilityName: string;
  farmerName: string;
  crop: string;
  qtyQuintals: number;
  durationDays: number;
  ratePerDay: number;
  totalCost: number;
  bookedAt: string;
}

export interface BuyerAd {
  id: string;
  crop: string;
  variety: string;
  required_qty_qtl: number;
  offered_rate: number;
  buyer_name: string;
  deliveryLocation: string;
  deadline: string;
  bidsReceived: number;
}

export interface CancellationClaim {
  id: string;
  farmer_id: string;
  farmer_name: string;
  listing_id: string;
  crop: string;
  qty: number;
  reason: string;
  date: string;
  status: "Pending Audit" | "Approved (No Penalty)" | "Rejected (Penalty Deducted)";
  aiVerdict?: string;
  aiRecommendation?: string;
  evidencePhoto?: string;
}

export type VehicleCategory = 
  | "Mini Pickup (Tata Ace / Bolero)" 
  | "Medium Truck (14ft / 17ft Eicher)" 
  | "Heavy Multi-Axle (10-Ton / 16-Ton)" 
  | "Reefer Cold Chain (Temperature Controlled)";

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  vehicleNo: string;
  vehicleType: VehicleCategory;
  capacityQuintals: number;
  temperatureControlled: boolean;
  baseRatePerKm: number;
  fixedBaseFare: number;
  operatingHub: string;
  currentLocation: string;
  status: "Available Now" | "On Trip" | "Reserved";
  rating: number;
  totalTrips: number;
  verifiedAadhaar: boolean;
  verifiedDL: boolean;
  insuranceValid: boolean;
  avatar: string;
  languages: string[];
  estimatedEtaMins: number;
}

export interface DeliveryBookingRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  vehicleNo: string;
  vehicleType: string;
  requesterRole: "farmer" | "buyer";
  requesterName: string;
  requesterPhone: string;
  crop: string;
  quantityQuintals: number;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  distanceKm: number;
  estimatedFare: number;
  paymentMethod: "Escrow Transport Lock" | "Pay on Delivery (Cash/UPI)" | "Advance 50%";
  specialNotes?: string;
  status: "Confirmed" | "Driver En Route" | "Loading at Farm" | "In Transit" | "Delivered";
  createdAt: string;
  bookingRef: string;
}

export interface VoiceExtractedData {
  detectedLanguage: string;
  languageCode: string;
  confidence: number;
  farmerDetails?: {
    name?: string;
    location?: string;
    phone?: string;
  };
  cropDetails: {
    crop: string;
    variety: string;
    qtyQuintals: number;
    ratePerKg: number;
    harvestDate: string;
    freshnessShelfDays: number;
    qualityGrade: "Grade A (Export / Supermarket)" | "Grade B (Standard Mandi)" | "Grade C (Processing)";
    packagingType: string;
    organicCertified: boolean;
    notes?: string;
  };
  summarySpoken: string;
  translationEnglish: string;
}

