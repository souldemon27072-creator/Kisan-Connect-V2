import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Languages,
  User,
  MapPin,
  Phone,
  Sprout,
  Calendar,
  IndianRupee,
  Scale,
  Package,
  ShieldCheck,
  X,
  Play,
  ArrowRight,
} from "lucide-react";
import { FarmerProfile, CropListing, VoiceExtractedData, Language } from "../types";

interface VoiceCropAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerProfile;
  onApplyExtractedData: (
    listingData: Partial<CropListing>,
    farmerUpdates?: Partial<FarmerProfile>
  ) => void;
  currentLanguage: Language;
}

const SAMPLE_VOICE_PROMPTS = [
  {
    lang: "Marathi (मराठी)",
    code: "mr-IN",
    text: "माझं नाव रमेश पाटील, दिंडोरी नाशिक. माझ्याकडे 40 क्विंटल उत्तम दर्जाचा लाल कांदा आहे. मला 32 रुपये प्रति किलो दर पाहिजे. कालच काढणी झाली आहे, सेंद्रिय पद्धतीने पिकवला आहे.",
    description: "40 Qtl Nashik Red Onion @ ₹32/kg (Organic)",
  },
  {
    lang: "Hindi (हिन्दी)",
    code: "hi-IN",
    text: "मेरा नाम रमेश कुमार है, नासिक महाराष्ट्र से। मेरे पास 30 क्विंटल हाइब्रिड अभिनव टमाटर हैं, जिनका भाव मुझे 28 रुपये प्रति किलो चाहिए। माल 25 किलो के क्रेट में पैक है।",
    description: "30 Qtl Tomato @ ₹28/kg in 25kg crates",
  },
  {
    lang: "Punjabi (ਪੰਜਾਬੀ)",
    code: "pa-IN",
    text: "ਮੇਰਾ ਨਾਮ ਹਰਪ੍ਰੀਤ ਸਿੰਘ ਹੈ। ਮੇਰੇ ਕੋਲ 80 ਕੁਇੰਟਲ ਸ਼ਰਬਤੀ ਕਣਕ ਤਿਆਰ ਹੈ, ਭਾਅ 24 ਰੁਪਏ ਕਿਲੋ ਚਾਹੀਦਾ ਹੈ। ਗੁਣਵੱਤਾ ਗ੍ਰੇਡ ਏ ਹੈ।",
    description: "80 Qtl Sharbati Wheat @ ₹24/kg Grade A",
  },
  {
    lang: "English / Hinglish",
    code: "en-IN",
    text: "I am Ramesh from Nashik farm. I want to sell 50 quintals of Kufri Jyoti potatoes at 22 rupees per kg, Grade A quality harvested 2 days ago.",
    description: "50 Qtl Potato @ ₹22/kg Grade A",
  },
  {
    lang: "Gujarati (ગુજરાતી)",
    code: "gu-IN",
    text: "મારું નામ રમેશભાઈ છે, નાસિકથી. મારી પાસે 25 ક્વિન્ટલ તાજા લાલ ટામેટાં છે, ભાવ 26 રૂપિયા કિલો જોઈએ છે.",
    description: "25 Qtl Fresh Tomato @ ₹26/kg",
  },
];

export const VoiceCropAssistantModal: React.FC<VoiceCropAssistantModalProps> = ({
  isOpen,
  onClose,
  farmer,
  onApplyExtractedData,
  currentLanguage,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<VoiceExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioAnimationRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Start with multilingual auto or preferred
        recognition.lang = currentLanguage === "Hindi" ? "hi-IN" : currentLanguage === "Marathi" ? "mr-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalTrans = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTrans += event.results[i][0].transcript + " ";
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (finalTrans) {
            setTranscript((prev) => (prev + " " + finalTrans).trim());
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setErrorMessage("Microphone access was denied. Please allow microphone permission or type/click a sample.");
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (audioAnimationRef.current) {
        cancelAnimationFrame(audioAnimationRef.current);
      }
    };
  }, [currentLanguage]);

  // Audio wave pulse animation while listening
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening]);

  if (!isOpen) return null;

  const startListening = () => {
    setErrorMessage(null);
    setTranscript("");
    setInterimTranscript("");
    setExtractedData(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.warn("Could not start speech recognition:", err);
        setIsListening(true);
      }
    } else {
      setIsListening(true);
    }
  };

  const stopListeningAndProcess = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);

    const fullText = (transcript + " " + interimTranscript).trim();
    if (!fullText) {
      setErrorMessage("No speech detected. Please speak clearly into your mic or try one of the sample phrases below.");
      return;
    }

    processSpeechText(fullText);
  };

  const processSpeechText = async (textToParse: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/gemini/voice-crop-parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechText: textToParse,
          currentFarmer: farmer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExtractedData(data);
        // Automatically speak back confirmation in detected language
        if (data.summarySpoken && typeof window !== "undefined" && window.speechSynthesis) {
          speakText(data.summarySpoken, data.languageCode || "hi-IN");
        }
      } else {
        setErrorMessage(data.error || "Could not parse agricultural details from speech.");
      }
    } catch (err: any) {
      console.error("Voice parse error:", err);
      setErrorMessage("Network error processing speech. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setTranscript(sampleText);
    setInterimTranscript("");
    processSpeechText(sampleText);
  };

  const speakText = (text: string, langCode: string = "hi-IN") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;

    const { cropDetails, farmerDetails } = extractedData;

    const listingUpdates: Partial<CropListing> = {
      crop: cropDetails.crop,
      variety: cropDetails.variety,
      qtyQuintals: cropDetails.qtyQuintals,
      ratePerKg: cropDetails.ratePerKg,
      harvestDate: cropDetails.harvestDate,
      freshnessShelfDays: cropDetails.freshnessShelfDays || 7,
      qualityGrade: cropDetails.qualityGrade,
      packagingType: cropDetails.packagingType,
      organicCertified: cropDetails.organicCertified,
    };

    const farmerUpdates: Partial<FarmerProfile> = {};
    if (farmerDetails?.name && farmerDetails.name !== farmer.name) {
      farmerUpdates.name = farmerDetails.name;
    }
    if (farmerDetails?.location && farmerDetails.location !== farmer.location) {
      farmerUpdates.location = farmerDetails.location;
    }

    onApplyExtractedData(listingUpdates, farmerUpdates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-200 dark:border-slate-800 overflow-hidden flex flex-col my-8 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-white">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">🎙️ AI Voice Crop & Profile Auto-Fill</h3>
                <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-200 text-[10px] uppercase font-bold rounded-full border border-emerald-400/40">
                  Multilingual AI
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Speak in your native language (Hindi, Marathi, Punjabi, Gujarati, etc.) to automatically fill your produce listing.
              </p>
            </div>
          </div>

          <button
            id="close-voice-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Mic Action Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 text-center space-y-4">
            <div className="flex flex-col items-center justify-center">
              {/* Pulsing Mic Button */}
              <div className="relative">
                {isListening && (
                  <div
                    className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"
                    style={{ transform: `scale(${1 + audioLevel / 100})` }}
                  />
                )}
                <button
                  id="toggle-mic-btn"
                  onClick={isListening ? stopListeningAndProcess : startListening}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl cursor-pointer ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-300 animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105 ring-4 ring-emerald-200 dark:ring-emerald-900/60"
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>

              <div className="mt-3">
                <span className="text-sm font-bold text-slate-800 dark:text-white block">
                  {isListening ? "🔴 Listening... Speak clearly now" : "Tap Microphone & Describe Your Produce"}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Say your name, location, crop name, quantity (quintals), and expected rate (₹/kg).
                </p>
              </div>
            </div>

            {/* Audio Waveform Bars Simulation */}
            {isListening && (
              <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                {[40, 70, 90, 60, 100, 80, 50, 95, 65, 85, 45, 75, 90, 60, 30].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-500 rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(6, (height * audioLevel) / 100)}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Live Real-Time Transcript Display Box */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left min-h-[70px]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Live Speech Transcript:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">
                {transcript || interimTranscript || (
                  <span className="text-slate-400 not-italic">
                    "बोलिए, जैसे: मेरा नाम रमेश है, मेरे पास 40 क्विंटल टमाटर हैं, 28 रुपये प्रति किलो..."
                  </span>
                )}
              </p>
            </div>

            {/* Finish & Process Button when active */}
            {isListening && (
              <button
                onClick={stopListeningAndProcess}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done Speaking • Process Details</span>
              </button>
            )}
          </div>

          {/* Quick Voice Demo Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Or Try Sample Voice Inputs (Multi-lingual):
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Click to test auto-detection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample.text)}
                  className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>{sample.lang}</span>
                    <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 italic">
                    "{sample.text}"
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                    🎯 {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* AI Processing Spinner */}
          {isProcessing && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Detecting Language & Extracting Crop Parameters with Gemini AI...
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Parsing crop type, quantity, pricing, grade, and farmer identity...
              </p>
            </div>
          )}

          {/* Extracted Structured Parameters Card */}
          {extractedData && !isProcessing && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-300 dark:border-emerald-800 space-y-4 animate-in fade-in">
              {/* Header with Detected Language Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200 dark:border-emerald-800/80">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Languages className="w-3.5 h-3.5" />
                    Detected: {extractedData.detectedLanguage} ({(extractedData.confidence * 100).toFixed(0)}% match)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Language Code: {extractedData.languageCode}
                  </span>
                </div>

                {extractedData.summarySpoken && (
                  <button
                    onClick={() => speakText(extractedData.summarySpoken, extractedData.languageCode)}
                    className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold hover:underline cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Replay Voice Summary</span>
                  </button>
                )}
              </div>

              {/* Spoken Confirmation Banner */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                  🗣️ Spoken Confirmation:
                </span>
                <p className="italic">"{extractedData.summarySpoken}"</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  🇬🇧 <strong>English:</strong> {extractedData.translationEnglish}
                </p>
              </div>

              {/* Extracted Fields Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Crop</span>
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5 text-sm">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                    {extractedData.cropDetails.crop}
                  </strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {extractedData.cropDetails.variety}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Quantity</span>
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5 text-sm">
                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                    {extractedData.cropDetails.qtyQuintals} Quintals
                  </strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    (~{extractedData.cropDetails.qtyQuintals * 100} kg)
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Asking Price</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 text-sm">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {extractedData.cropDetails.ratePerKg} / kg
                  </strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    ₹{extractedData.cropDetails.ratePerKg * 100} / Quintal
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Quality Grade</span>
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    {extractedData.cropDetails.qualityGrade}
                  </strong>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Packaging</span>
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1 mt-0.5 text-xs truncate">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    {extractedData.cropDetails.packagingType || "Standard Crates/Bags"}
                  </strong>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Organic Status</span>
                  <strong className={`flex items-center gap-1 mt-0.5 text-xs ${extractedData.cropDetails.organicCertified ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {extractedData.cropDetails.organicCertified ? "🌱 Certified Organic" : "Standard Farming"}
                  </strong>
                </div>
              </div>

              {/* Farmer Profile Updates if mentioned */}
              {extractedData.farmerDetails && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Farmer:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {extractedData.farmerDetails.name || farmer.name}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Location:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {extractedData.farmerDetails.location || farmer.location}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          {extractedData && (
            <button
              id="apply-voice-data-btn"
              onClick={handleApply}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Fill Produce Form ➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
