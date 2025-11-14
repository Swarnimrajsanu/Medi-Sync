import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { AIRequest, HealthAIRequest, HealthAIResponse } from "@/types/ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIRequest | HealthAIRequest = await req.json();
    
    // Check if this is a health analysis request (has symptoms field)
    const isHealthAnalysis = "symptoms" in body;
    
    if (isHealthAnalysis) {
      // Health AI Assistant endpoint
      const { symptoms, reportUrl } = body as HealthAIRequest;

      if (!symptoms || !symptoms.trim()) {
        return NextResponse.json({ error: "Symptoms description is required" }, { status: 400 });
      }

      // Check if Gemini API key is configured
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json({ 
          error: "AI service is not configured. Please contact support." 
        }, { status: 500 });
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // Build the prompt for structured health analysis
      const healthPrompt = `You are a medical AI assistant for MediSync healthcare platform. Analyze the following patient symptoms and provide a structured medical analysis.

IMPORTANT: You are NOT providing a diagnosis. You are providing general health information and recommendations.

Patient Symptoms:
${symptoms}

${reportUrl ? `Medical Report Available: ${reportUrl}` : ""}

Please provide a structured analysis in the following JSON format:
{
  "summary": "Brief summary of the symptoms and potential concerns",
  "suggestedTests": ["Test 1", "Test 2", "Test 3"],
  "specialist": "Recommended specialist type (e.g., Cardiologist, Neurologist, General Physician)",
  "estimatedSeverity": "low" | "medium" | "high",
  "recommendedSurgery": "Optional: Surgery recommendation if applicable, otherwise omit this field",
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}

CRITICAL DISCLAIMERS:
- This is NOT a medical diagnosis
- Always recommend consulting a healthcare professional
- For emergencies, direct to emergency services (108)
- Be empathetic and clear
- Prioritize patient safety

Return ONLY valid JSON, no additional text.`;

      // Try different model names
      const modelNames = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
      let aiResponse = "";
      let lastError: any = null;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(healthPrompt);
          const response = await result.response;
          aiResponse = response.text();
          console.log(`Successfully used model: ${modelName}`);
          break;
        } catch (modelError: any) {
          lastError = modelError;
          const isModelNotFound = modelError.message?.includes("404") || modelError.message?.includes("not found");
          const isOverloaded = modelError.message?.includes("503") || 
                              modelError.message?.includes("overloaded") || 
                              modelError.message?.includes("Service Unavailable");
          
          if (isModelNotFound || isOverloaded) {
            console.log(`Model ${modelName} ${isOverloaded ? 'is overloaded' : 'not available'}, trying next...`);
            continue;
          }
          throw modelError;
        }
      }

      if (!aiResponse && lastError) {
        throw lastError;
      }

      // Parse JSON response
      try {
        // Clean the response (remove markdown code blocks if present)
        let cleanedResponse = aiResponse.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
        }

        const parsedResponse: HealthAIResponse = JSON.parse(cleanedResponse);
        
        // Validate and set defaults
        const healthResponse: HealthAIResponse = {
          summary: parsedResponse.summary || "Analysis completed. Please consult a healthcare professional.",
          suggestedTests: Array.isArray(parsedResponse.suggestedTests) ? parsedResponse.suggestedTests : [],
          specialist: parsedResponse.specialist || "General Physician",
          estimatedSeverity: parsedResponse.estimatedSeverity || "medium",
          riskFactors: Array.isArray(parsedResponse.riskFactors) ? parsedResponse.riskFactors : [],
          nextSteps: Array.isArray(parsedResponse.nextSteps) ? parsedResponse.nextSteps : [],
        };

        if (parsedResponse.recommendedSurgery) {
          healthResponse.recommendedSurgery = parsedResponse.recommendedSurgery;
        }

        return NextResponse.json(healthResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        // Fallback to structured response
        return NextResponse.json({
          summary: aiResponse || "Analysis completed. Please consult a healthcare professional for proper diagnosis.",
          suggestedTests: ["General health checkup", "Blood tests", "Consultation with specialist"],
          specialist: "General Physician",
          estimatedSeverity: "medium" as const,
          riskFactors: [],
          nextSteps: ["Schedule appointment with healthcare provider", "Monitor symptoms", "Follow medical advice"],
        });
      }
    } else {
      // Original chat endpoint
      const { message, context } = body as AIRequest;

      if (!message || !message.trim()) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json({ 
          error: "AI service is not configured. Please contact support." 
        }, { status: 500 });
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      const systemPrompt = `You are a helpful medical AI assistant for MediSync, a healthcare platform. Your role is to:
- Provide general health information and guidance
- Help users understand symptoms (but NOT diagnose)
- Guide users to appropriate healthcare resources
- Assist with emergency situations
- Answer medication-related questions
- Help find hospitals and doctors

IMPORTANT DISCLAIMERS:
- You are NOT a replacement for professional medical advice
- You cannot provide medical diagnoses
- For emergencies, always direct users to call 108 or use the SOS feature
- For serious symptoms, always recommend consulting a healthcare professional

Be concise, empathetic, and helpful. Always prioritize user safety.`;

      const userPrompt = context 
        ? `${systemPrompt}\n\nContext: ${context}\n\nUser Question: ${message}\n\nProvide a helpful response:`
        : `${systemPrompt}\n\nUser Question: ${message}\n\nProvide a helpful response:`;

      const modelNames = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
      let aiResponse = "";
      let lastError: any = null;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(userPrompt);
          const response = await result.response;
          aiResponse = response.text();
          console.log(`Successfully used model: ${modelName}`);
          break;
        } catch (modelError: any) {
          lastError = modelError;
          const isModelNotFound = modelError.message?.includes("404") || modelError.message?.includes("not found");
          const isOverloaded = modelError.message?.includes("503") || 
                              modelError.message?.includes("overloaded") || 
                              modelError.message?.includes("Service Unavailable");
          
          if (isModelNotFound || isOverloaded) {
            console.log(`Model ${modelName} ${isOverloaded ? 'is overloaded' : 'not available'}, trying next...`);
            continue;
          }
          throw modelError;
        }
      }

      if (!aiResponse && lastError) {
        throw lastError;
      }

      const suggestions: string[] = [];
      const responseLower = aiResponse.toLowerCase();
      
      if (responseLower.includes("emergency") || responseLower.includes("sos") || responseLower.includes("urgent")) {
        suggestions.push("Send SOS Alert");
      }
      if (responseLower.includes("hospital") || responseLower.includes("clinic")) {
        suggestions.push("Find Nearby Hospitals");
      }
      if (responseLower.includes("doctor") || responseLower.includes("physician")) {
        suggestions.push("Contact Doctor");
      }
      if (responseLower.includes("108") || responseLower.includes("emergency services")) {
        suggestions.push("Call Emergency Services");
      }

      if (suggestions.length === 0) {
        suggestions.push("Emergency SOS", "Find Hospitals", "Contact Doctor");
      }

      return NextResponse.json({
        response: aiResponse,
        suggestions: suggestions.slice(0, 3),
      });
    }
  } catch (error: any) {
    console.error("AI error:", error);
    
    if (error.message?.includes("API_KEY") || error.message?.includes("API key")) {
      return NextResponse.json({ 
        error: "AI service configuration error. Please contact support." 
      }, { status: 500 });
    }
    
    if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      return NextResponse.json({ 
        error: "AI service is temporarily unavailable. Please try again later." 
      }, { status: 503 });
    }

    if (error.message?.includes("overloaded") || error.message?.includes("503")) {
      return NextResponse.json({ 
        error: "AI service is currently overloaded. Please try again in a moment." 
      }, { status: 503 });
    }

    if (error.message?.includes("not found") || error.message?.includes("404")) {
      return NextResponse.json({ 
        error: "AI model configuration error. Please contact support." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: error.message || "An error occurred while processing your request. Please try again." 
    }, { status: 500 });
  }
}
