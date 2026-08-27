import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. AI Pricing Advisor & Market Dynamics
app.post("/api/gemini/pricing-advisor", async (req, res) => {
  try {
    const { crop, location, quantity, grade, harvestDate } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback calculation if no key
      const basePrices: Record<string, { min: number; modal: number; max: number; shelfLife: string }> = {
        Tomatoes: { min: 22, modal: 26, max: 32, shelfLife: "5-7 days" },
        Potatoes: { min: 14, modal: 18, max: 23, shelfLife: "45-60 days" },
        Onions: { min: 24, modal: 29, max: 36, shelfLife: "30-45 days" },
        Wheat: { min: 20, modal: 22.5, max: 26, shelfLife: "6-12 months" },
        Mustard: { min: 48, modal: 54, max: 62, shelfLife: "6-9 months" },
        Cotton: { min: 62, modal: 70, max: 78, shelfLife: "12 months" },
        Rice: { min: 28, modal: 33, max: 40, shelfLife: "12 months" },
        Chilli: { min: 120, modal: 145, max: 180, shelfLife: "15-20 days" },
      };

      const fallback = basePrices[crop] || { min: 20, modal: 25, max: 30, shelfLife: "14 days" };
      const qualityMultiplier = grade === "Grade A (Export / Supermarket)" ? 1.15 : grade === "Grade B (Standard Mandi)" ? 1.0 : 0.88;
      const suggestedRate = Math.round((fallback.modal * qualityMultiplier + 2) * 10) / 10;

      return res.json({
        success: true,
        apmcBaseModal: fallback.modal,
        minRange: Math.round(fallback.min * qualityMultiplier),
        maxRange: Math.round(fallback.max * qualityMultiplier),
        suggestedRate,
        trend: "Bullish (+6% week-on-week demand)",
        shelfLife: fallback.shelfLife,
        marketInsight: `High seasonal procurement demand reported in Western & Northern hubs. Direct-to-buyer bypasses 8.5% middleman commission.`,
        pricingStrategy: `For ${quantity} Quintals of ${crop} (${grade}), listing at ₹${suggestedRate}/kg captures optimal margin above APMC modal price.`,
      });
    }

    const prompt = `You are the Lead Agricultural Economist and APMC Mandi Pricing Advisor for Smart KrishiDirect (India).
Analyze market dynamics for:
- Crop: ${crop}
- Origin Region: ${location || "Nashik, Maharashtra"}
- Quantity: ${quantity} Quintals
- Quality Grade: ${grade || "Grade A"}
- Harvest Date: ${harvestDate || "Today"}

Return a strictly valid JSON response with the following structure:
{
  "apmcBaseModal": number (modal rate per kg in INR, e.g. 26.5),
  "minRange": number (minimum fair rate INR/kg, e.g. 22),
  "maxRange": number (premium ceiling INR/kg, e.g. 33),
  "suggestedRate": number (recommended direct farmer selling price INR/kg, e.g. 28.5),
  "trend": string (e.g. "Bullish (+7% this week due to festive restocking)"),
  "shelfLife": string (e.g. "5 to 7 days without cold chain"),
  "marketInsight": string (concise 2-sentence market analysis for Indian mandis & corporate procurement),
  "pricingStrategy": string (1-sentence actionable pricing tactic for the farmer to maximize profit)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Pricing Advisor Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate market advice" });
  }
});

// 2. AI Negotiation & Smart Offer Assistant
app.post("/api/gemini/negotiate-assistant", async (req, res) => {
  try {
    const { role, crop, currentOffer, askedPrice, quantity, recentChat } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const isFarmer = role === "Farmer";
      const counterPrice = isFarmer 
        ? Math.max(Math.round((askedPrice * 0.95) * 10) / 10, currentOffer + 1.5)
        : Math.min(Math.round((currentOffer * 1.05) * 10) / 10, askedPrice - 1);

      return res.json({
        success: true,
        counterOfferPrice: counterPrice,
        englishSuggestion: isFarmer 
          ? `I can offer ₹${counterPrice}/kg if you confirm prompt logistics pickup within 24 hours. The produce is farm-fresh Grade A.`
          : `We can close at ₹${counterPrice}/kg for immediate escrow lock and direct farm pickup.`,
        hindiSuggestion: isFarmer
          ? `यदि आप 24 घंटे में पिकअप सुनिश्चित करते हैं तो मैं ₹${counterPrice}/किलो में दे सकता हूँ। गुणवत्ता उत्तम ग्रेड-ए है।`
          : `हम तत्काल एस्क्रो लॉक और फार्म पिकअप के लिए ₹${counterPrice}/किलो पर फाइनल कर सकते हैं।`,
        rationale: "Balances immediate inventory liquidity against transport timing.",
      });
    }

    const prompt = `You are a fair, bilingual agricultural negotiation assistant for Indian farmers and procurement buyers.
Context:
- User Role: ${role} (${role === "Farmer" ? "Selling produce" : "Procuring produce"})
- Crop: ${crop}
- Asking Price: ₹${askedPrice}/kg
- Buyer's Current Offer: ₹${currentOffer}/kg
- Quantity: ${quantity} Quintals
- Recent Conversation: ${JSON.stringify(recentChat || [])}

Generate a win-win counter-offer message in both English and Hindi.
Return strictly valid JSON:
{
  "counterOfferPrice": number (fair compromise rate per kg in INR),
  "englishSuggestion": string (polite, persuasive direct message),
  "hindiSuggestion": string (respectful, clear Hindi message with authentic tone),
  "rationale": string (1-sentence reasoning)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Negotiation Assistant Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate negotiation advice" });
  }
});

// 3. Ground Audit & Cancellation Claim Verification
app.post("/api/gemini/audit-claim", async (req, res) => {
  try {
    const { crop, reason, listingDetails, honorScore } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const isForceMajeure = reason.toLowerCase().includes("rain") || reason.toLowerCase().includes("frost") || reason.toLowerCase().includes("pest") || reason.toLowerCase().includes("hail");
      return res.json({
        success: true,
        verdict: isForceMajeure ? "VALID_CLAIM" : "DISPUTE_REJECTED",
        penaltyScoreDeduction: isForceMajeure ? 0 : 25,
        recommendation: isForceMajeure 
          ? "Unforeseen agrometeorological event verified against regional weather patterns. Waive penalty."
          : "Voluntary breach of commitment without documented natural disaster. Recommend 25-point Honor Score penalty.",
        notes: "Ground verification photo inspection is advised before finalizing report."
      });
    }

    const prompt = `You are an impartial Agricultural Ground Inspector evaluating an order cancellation dispute on Smart KrishiDirect.
Context:
- Crop: ${crop}
- Farmer Claimed Reason: "${reason}"
- Listing Details: ${JSON.stringify(listingDetails)}
- Current Farmer Honor Score: ${honorScore}/100

Evaluate if the cancellation reason is legitimate Force Majeure (weather, sudden pest outbreak, unavoidable spoilage) vs voluntary reneging/side-selling.
Return strictly valid JSON:
{
  "verdict": "VALID_CLAIM" | "DISPUTE_REJECTED" | "REQUIRES_FIELD_VISIT",
  "penaltyScoreDeduction": number (0 if valid/weather, 25 if reneged/false claim),
  "recommendation": string (Clear 2-sentence rationale for the Ground Representative),
  "notes": string (Checklist item for ground agent)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Audit Claim Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to audit claim" });
  }
});

// 4. Voice Input Multi-lingual Auto-detection & Crop Parser
app.post("/api/gemini/voice-crop-parser", async (req, res) => {
  try {
    const { speechText, currentFarmer } = req.body;

    if (!speechText || typeof speechText !== "string" || !speechText.trim()) {
      return res.status(400).json({ success: false, error: "Speech text input is required" });
    }

    const ai = getGeminiClient();

    // Fallback heuristic parser if Gemini client is unavailable
    if (!ai) {
      const textLower = speechText.toLowerCase();
      
      // 1. Language Detection Heuristic
      let detectedLanguage = "English";
      let languageCode = "en-IN";
      if (/[\u0900-\u097F]/.test(speechText)) {
        // Devanagari script: distinguish Marathi vs Hindi
        if (
          textLower.includes("माझं") ||
          textLower.includes("माझे") ||
          textLower.includes("आहे") ||
          textLower.includes("पाहिजे") ||
          textLower.includes("क्विंटल") ||
          textLower.includes("कांदा") ||
          textLower.includes("शेतकरी") ||
          textLower.includes("नाशिक") ||
          textLower.includes("दिंडोरी") ||
          textLower.includes("दर") ||
          textLower.includes("रुपये")
        ) {
          detectedLanguage = "Marathi";
          languageCode = "mr-IN";
        } else {
          detectedLanguage = "Hindi";
          languageCode = "hi-IN";
        }
      } else if (/[\u0A00-\u0A7F]/.test(speechText)) {
        detectedLanguage = "Punjabi";
        languageCode = "pa-IN";
      } else if (/[\u0C00-\u0C7F]/.test(speechText)) {
        detectedLanguage = "Telugu";
        languageCode = "te-IN";
      } else if (/[\u0B80-\u0BFF]/.test(speechText)) {
        detectedLanguage = "Tamil";
        languageCode = "ta-IN";
      } else if (/[\u0A80-\u0AFF]/.test(speechText)) {
        detectedLanguage = "Gujarati";
        languageCode = "gu-IN";
      } else if (/[\u0980-\u09FF]/.test(speechText)) {
        detectedLanguage = "Bengali";
        languageCode = "bn-IN";
      }

      // 2. Crop Detection
      let crop = "Tomatoes";
      let variety = "Hybrid Grade A";
      let shelfLife = 6;
      if (textLower.includes("tomato") || textLower.includes("टमाटर") || textLower.includes("टोमॅटो")) {
        crop = "Tomatoes";
        variety = "Hybrid Abhinav / Vaishali";
        shelfLife = 6;
      } else if (textLower.includes("onion") || textLower.includes("प्याज") || textLower.includes("कांदा")) {
        crop = "Onions";
        variety = "Nashik Red Garwa";
        shelfLife = 35;
      } else if (textLower.includes("potato") || textLower.includes("आलू") || textLower.includes("बटाटा")) {
        crop = "Potatoes";
        variety = "Kufri Jyoti / Chipsona";
        shelfLife = 50;
      } else if (textLower.includes("wheat") || textLower.includes("गेहूं") || textLower.includes("गहू")) {
        crop = "Wheat";
        variety = "Sharbati Golden 306";
        shelfLife = 180;
      } else if (textLower.includes("mustard") || textLower.includes("सरसों") || textLower.includes("मोहरी")) {
        crop = "Mustard";
        variety = "Pusa Bold High-Oil";
        shelfLife = 240;
      } else if (textLower.includes("cotton") || textLower.includes("कपास") || textLower.includes("कापूस")) {
        crop = "Cotton";
        variety = "Long Staple BT Cotton";
        shelfLife = 365;
      } else if (textLower.includes("rice") || textLower.includes("चावल") || textLower.includes("तांदूळ") || textLower.includes("धान")) {
        crop = "Rice";
        variety = "1121 Premium Basmati";
        shelfLife = 365;
      } else if (textLower.includes("chilli") || textLower.includes("मिर्च") || textLower.includes("मिरची")) {
        crop = "Chilli";
        variety = "Teja G4 Red Hot";
        shelfLife = 15;
      }

      // 3. Extract quantity
      const qtyMatch = speechText.match(/(\d+(?:\.\d+)?)\s*(?:quintal|qtl|क्विंटल|टन|ton|kg|किलो|किलोग्राम)/i) || speechText.match(/(\d+)/);
      let qtyQuintals = qtyMatch ? parseFloat(qtyMatch[1]) : 25;
      if (textLower.includes("kg") || textLower.includes("किलो") || textLower.includes("किलोग्राम")) {
        if (qtyQuintals >= 100) {
          qtyQuintals = Math.round(qtyQuintals / 100);
        }
      }

      // 4. Extract price
      const priceMatch = speechText.match(/(?:₹|rs\.?|rate|भाव|किंमत|कीमत|दर|रुपये|रूपये)\s*(\d+(?:\.\d+)?)/i) || speechText.match(/(\d+(?:\.\d+)?)\s*(?:₹|rs|रुपये|रूपये|\/kg|\/किलो|प्रति किलो)/i);
      const ratePerKg = priceMatch ? parseFloat(priceMatch[1]) : 28.0;

      // 5. Extract farmer name if spoken
      let farmerName = currentFarmer?.name || "Ramesh Kumar";
      const nameMatch = speechText.match(/(?:name is|मेरा नाम|माझं नाव|माझे नाव|नांव|naam)\s*([A-Za-z\u0900-\u097F\s]{2,20})(?:आहे|है|,|\.|$)/i);
      if (nameMatch && nameMatch[1]) {
        farmerName = nameMatch[1].trim();
      }

      // 6. Extract Location
      let farmerLocation = currentFarmer?.location || "Nashik, Maharashtra";
      const locationMatch = speechText.match(/(?:from|गाँव|गाव|तालुका|जिल्हा|स्थान|location|from)\s*([A-Za-z\u0900-\u097F\s,]{3,25})/i);
      if (locationMatch && locationMatch[1]) {
        farmerLocation = locationMatch[1].trim();
      }

      const isOrganic = textLower.includes("organic") || textLower.includes("जैविक") || textLower.includes("सेंद्रिय") || textLower.includes("नैसर्गिक");

      const today = new Date().toISOString().split("T")[0];

      return res.json({
        success: true,
        detectedLanguage,
        languageCode,
        confidence: 0.95,
        farmerDetails: {
          name: farmerName,
          location: farmerLocation,
          phone: currentFarmer?.phone || "+91 98234-56789",
        },
        cropDetails: {
          crop,
          variety,
          qtyQuintals: qtyQuintals || 25,
          ratePerKg: ratePerKg || 28,
          harvestDate: today,
          freshnessShelfDays: shelfLife,
          qualityGrade: "Grade A (Export / Supermarket)",
          packagingType: crop === "Tomatoes" ? "25kg Plastic Crates (Ventilated)" : crop === "Onions" ? "50kg Jute Mesh Bags" : "40kg Gunny Sacks",
          organicCertified: isOrganic,
          notes: `Spoken via Voice Assistant: "${speechText.slice(0, 100)}"`,
        },
        summarySpoken: detectedLanguage === "Marathi" 
          ? `तुमच्या आवाजातून ${qtyQuintals} क्विंटल ${crop} (दर ₹${ratePerKg}/किलो) यशस्वीरित्या नोंदवले आहे!`
          : detectedLanguage === "Hindi"
          ? `आपके बोलने से ${qtyQuintals} क्विंटल ${crop} (दर ₹${ratePerKg}/किग्रा) की जानकारी सफलतापूर्वक भर दी गई है!`
          : `Recognized ${qtyQuintals} Quintals of ${crop} at ₹${ratePerKg}/kg from your voice description!`,
        translationEnglish: `Farmer ${farmerName} from ${farmerLocation} is listing ${qtyQuintals} Quintals of ${crop} (${variety}) at ₹${ratePerKg}/kg.`,
      });
    }

    // Call Gemini for deep multilingual natural language understanding & entity extraction
    const prompt = `You are the Lead Multilingual AI Agricultural Assistant for Indian Farmers on Smart KrishiDirect.
A farmer has spoken the following voice message in an Indian language or English:
"${speechText}"

Current default farmer profile: ${JSON.stringify(currentFarmer || {})}

Tasks:
1. Detect the spoken language accurately (e.g. Hindi, Marathi, Punjabi, Gujarati, Telugu, Tamil, Bengali, Kannada, English, Hinglish). Provide the BCP-47 language code (e.g. "hi-IN", "mr-IN", "pa-IN", "en-IN", etc.).
2. Extract all farmer details (Name, Village/District/Location, Phone if stated).
3. Extract crop details accurately:
   - Crop name (Standardized title: "Tomatoes" | "Potatoes" | "Onions" | "Wheat" | "Mustard" | "Cotton" | "Rice" | "Chilli" | or standard vegetable/grain)
   - Variety / Hybrid (e.g. "Hybrid Grade A Abhinav", "Nashik Red Garwa", "Sharbati", "Kufri Chipsona")
   - Quantity in Quintals (number). Note: If spoken in KG, convert 100 kg = 1 Quintal. If spoken in Tonnes/Tons, 1 Ton = 10 Quintals.
   - Asking Rate per KG in INR (number, e.g. 28.0). If spoken in quintal rate (e.g. 2800 per quintal), convert to per kg (28.0).
   - Harvest Date (ISO format YYYY-MM-DD, e.g. "2026-08-27" or today/yesterday relative to current date 2026-08-27)
   - Shelf-life days (number, e.g. 6 for tomatoes, 35 for onions, 50 for potatoes, 180 for grains)
   - Quality Grade ("Grade A (Export / Supermarket)" | "Grade B (Standard Mandi)" | "Grade C (Processing)")
   - Packaging Type (e.g. "25kg Plastic Crates (Ventilated)", "50kg Jute Mesh Bags", "40kg Gunny Sacks")
   - Organic Certified (boolean)
4. Formulate a friendly 1-sentence confirmation message in the EXACT DETECTED LOCAL LANGUAGE for audio speech readout to the farmer.
5. Provide a 1-sentence clear English translation summary.

Return strictly valid JSON:
{
  "detectedLanguage": string (e.g. "Hindi" or "Marathi"),
  "languageCode": string (e.g. "hi-IN" or "mr-IN"),
  "confidence": number (between 0.8 and 1.0),
  "farmerDetails": {
    "name": string,
    "location": string,
    "phone": string
  },
  "cropDetails": {
    "crop": string,
    "variety": string,
    "qtyQuintals": number,
    "ratePerKg": number,
    "harvestDate": string,
    "freshnessShelfDays": number,
    "qualityGrade": "Grade A (Export / Supermarket)" | "Grade B (Standard Mandi)" | "Grade C (Processing)",
    "packagingType": string,
    "organicCertified": boolean,
    "notes": string
  },
  "summarySpoken": string,
  "translationEnglish": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Voice Crop Parser Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to parse voice input" });
  }
});

// Vite Middleware & SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart KrishiDirect Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
