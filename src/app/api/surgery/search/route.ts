import HospitalModel from "@/app/model/Hospital.model";
import { connectDB } from "@/lib/dbConnect";
import { AIRecommendation, SurgerySearchRequest, SurgerySearchResponse } from "@/types/surgery";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    let body: SurgerySearchRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body. Please check your input." },
        { status: 400 }
      );
    }

    const { symptoms, surgeryType, city, budget } = body;

    if (!budget || budget <= 0) {
      return NextResponse.json(
        { error: "Budget is required and must be greater than 0" },
        { status: 400 }
      );
    }

    // Step 1: Search MongoDB for matching hospitals
    const query: any = {};

    // Filter by city if provided
    if (city && city.trim()) {
      query.city = { $regex: new RegExp(city.trim(), "i") };
    }

    // Filter surgeries where minCost <= budget
    query["surgeries.minCost"] = { $lte: budget };

    // Filter by surgery type if provided
    if (surgeryType && surgeryType.trim()) {
      query["surgeries.type"] = { $regex: new RegExp(surgeryType.trim(), "i") };
    }

    // Query database
    const dbHospitals = await HospitalModel.find(query)
      .sort({ rating: -1, "surgeries.minCost": 1 })
      .limit(20)
      .lean();

    // Transform to match Hospital interface
    const hospitals = dbHospitals
      .map((h) => {
        // Filter surgeries that match budget
        const matchingSurgeries = h.surgeries.filter(
          (s: any) => s.minCost <= budget
        );

        if (matchingSurgeries.length === 0) return null;

        return {
          id: h._id.toString(),
          name: h.name,
          city: h.city,
          address: h.address,
          rating: h.rating,
          surgeries: matchingSurgeries.map((s: any) => ({
            type: s.type,
            minCost: s.minCost,
            maxCost: s.maxCost,
            specialty: s.specialty,
          })),
          distance: h.distance,
          image: h.image,
          contact: h.contact,
        };
      })
      .filter((h) => h !== null);

    // Step 2: Hybrid Approach Logic
    let response: SurgerySearchResponse;
    let aiRecommendations: AIRecommendation | undefined;

    if (hospitals.length > 0) {
      // Real hospitals found - check if we should also include AI insights
      if (hospitals.length < 3) {
        // Few results - get AI recommendations as suggestions
        try {
          aiRecommendations = await getAIRecommendations(
            symptoms,
            surgeryType,
            city,
            budget
          );
          response = {
            hospitals,
            aiRecommendations,
            source: "hybrid",
            message: `Found ${hospitals.length} hospital(s) matching your criteria. AI suggestions are also available.`,
          };
        } catch (aiError: any) {
          console.error("AI recommendations failed:", aiError);
          // If AI fails, just return the real hospitals without AI suggestions
          response = {
            hospitals,
            source: "database",
            message: `Found ${hospitals.length} hospital(s) matching your criteria.`,
          };
        }
      } else {
        // Enough results - return only real hospitals
        response = {
          hospitals,
          source: "database",
          message: `Found ${hospitals.length} hospital(s) matching your criteria.`,
        };
      }
    } else {
      // No hospitals found - use AI fallback
      try {
        aiRecommendations = await getAIRecommendations(
          symptoms,
          surgeryType,
          city,
          budget
        );

        response = {
          hospitals: [],
          aiRecommendations,
          source: "ai",
          message:
            "No hospitals found in our database matching your criteria. Here are AI-generated recommendations based on your requirements.",
        };
      } catch (aiError: any) {
        console.error("AI recommendations failed:", aiError);
        // Even if AI fails, return empty results with a helpful message
        response = {
          hospitals: [],
          source: "database",
          message:
            "No hospitals found in our database matching your criteria. Please try adjusting your budget, location, or surgery type.",
        };
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Surgery search error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}

async function getAIRecommendations(
  symptoms?: string,
  surgeryType?: string,
  city?: string,
  budget?: number
): Promise<AIRecommendation> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("AI service is not configured");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // Try different models in order (prioritize stable models)
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp", // Experimental, try last
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `You are a medical cost estimation AI for MediSync healthcare platform. Based on the following information, provide a structured cost estimation and hospital recommendations.

${symptoms ? `Patient Symptoms: ${symptoms}` : ""}
${surgeryType ? `Surgery Type: ${surgeryType}` : ""}
${city ? `City/Location: ${city}` : ""}
${budget ? `Patient Budget: ₹${budget.toLocaleString()}` : ""}

Please provide a structured JSON response with the following format:
{
  "estimatedCostRange": {
    "min": <minimum estimated cost in INR>,
    "max": <maximum estimated cost in INR>,
    "currency": "INR"
  },
  "hospitalTypes": [
    {
      "type": "government",
      "estimatedCost": {
        "min": <minimum cost>,
        "max": <maximum cost>
      },
      "reasoning": "<why this hospital type is recommended>"
    },
    {
      "type": "trust",
      "estimatedCost": {
        "min": <minimum cost>,
        "max": <maximum cost>
      },
      "reasoning": "<why this hospital type is recommended>"
    },
    {
      "type": "private",
      "estimatedCost": {
        "min": <minimum cost>,
        "max": <maximum cost>
      },
      "reasoning": "<why this hospital type is recommended>"
    }
  ],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recoveryTime": "<estimated recovery time>",
  "suggestedSpecialists": ["<specialist 1>", "<specialist 2>", "<specialist 3>"],
  "reasoning": "<overall reasoning for the cost estimation>"
}

IMPORTANT:
- Provide realistic cost estimates based on Indian healthcare market
- Costs should be in INR (Indian Rupees)
- Government hospitals are typically 50-70% cheaper than private
- Trust hospitals are typically 30-50% cheaper than private
- Private hospitals offer premium services at higher costs
- Be specific and realistic with cost ranges
- Return ONLY valid JSON, no markdown formatting or code blocks`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response (remove markdown code blocks if present)
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      const aiData = JSON.parse(jsonText);

      // Validate and structure the response
      return {
        estimatedCostRange: {
          min: Number(aiData.estimatedCostRange?.min) || 0,
          max: Number(aiData.estimatedCostRange?.max) || 0,
          currency: aiData.estimatedCostRange?.currency || "INR",
        },
        hospitalTypes: (aiData.hospitalTypes || []).map((ht: any) => ({
          type: ht.type || "private",
          estimatedCost: {
            min: Number(ht.estimatedCost?.min) || 0,
            max: Number(ht.estimatedCost?.max) || 0,
          },
          reasoning: ht.reasoning || "",
        })),
        risks: Array.isArray(aiData.risks) ? aiData.risks : [],
        recoveryTime: aiData.recoveryTime || "Not specified",
        suggestedSpecialists: Array.isArray(aiData.suggestedSpecialists)
          ? aiData.suggestedSpecialists
          : [],
        reasoning: aiData.reasoning || "",
      };
    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error);
      lastError = error;

      // Check for errors that should trigger fallback to next model
      const errorMessage = error.message || "";
      const isModelNotFound = errorMessage.includes("404") || errorMessage.includes("not found");
      const isOverloaded = errorMessage.includes("503") || 
                          errorMessage.includes("overloaded") || 
                          errorMessage.includes("Service Unavailable");
      const isRateLimited = errorMessage.includes("429") || 
                           errorMessage.includes("Too Many Requests") ||
                           errorMessage.includes("quota") ||
                           errorMessage.includes("Quota exceeded");

      // If it's a 404, 503, or 429 (rate limit), try next model
      if (isModelNotFound || isOverloaded || isRateLimited) {
        console.log(`Model ${modelName} ${isRateLimited ? 'rate limited' : isOverloaded ? 'overloaded' : 'not available'}, trying next...`);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // If all models failed, provide a fallback response
  if (lastError) {
    console.error("All AI models failed, providing fallback response");
    
    // Provide a basic fallback recommendation based on budget
    const fallbackBudget = budget || 100000; // Default to ₹1L if budget not provided
    const estimatedMin = fallbackBudget * 0.5;
    const estimatedMax = fallbackBudget * 1.5;
    
    return {
      estimatedCostRange: {
        min: Math.round(estimatedMin),
        max: Math.round(estimatedMax),
        currency: "INR",
      },
      hospitalTypes: [
        {
          type: "government",
          estimatedCost: {
            min: Math.round(estimatedMin * 0.3),
            max: Math.round(estimatedMax * 0.5),
          },
          reasoning: "Government hospitals offer the most affordable options with quality care. Typically 50-70% cheaper than private hospitals.",
        },
        {
          type: "trust",
          estimatedCost: {
            min: Math.round(estimatedMin * 0.5),
            max: Math.round(estimatedMax * 0.7),
          },
          reasoning: "Trust hospitals provide a balance between cost and quality. Typically 30-50% cheaper than private hospitals.",
        },
        {
          type: "private",
          estimatedCost: {
            min: Math.round(estimatedMin),
            max: Math.round(estimatedMax),
          },
          reasoning: "Private hospitals offer premium services with advanced facilities and shorter wait times.",
        },
      ],
      risks: [
        "Surgical complications may vary based on individual health conditions",
        "Post-operative care and recovery time depend on the specific procedure",
        "Costs may vary based on hospital location and surgeon expertise",
      ],
      recoveryTime: "Recovery time varies based on the specific surgery type and individual patient factors. Consult with your healthcare provider for accurate estimates.",
      suggestedSpecialists: [
        "Consult with a specialist based on your specific surgery type",
        "Get a second opinion before making a decision",
        "Consider the surgeon's experience and hospital's success rate",
      ],
      reasoning: `Based on your budget of ₹${fallbackBudget.toLocaleString()}, we recommend exploring all three hospital types. Government hospitals offer the most cost-effective options, while private hospitals provide premium services. Please consult with healthcare professionals for accurate cost estimates and recommendations specific to your condition.`,
    };
  }
  
  throw new Error("All AI models failed and fallback generation failed");
}

