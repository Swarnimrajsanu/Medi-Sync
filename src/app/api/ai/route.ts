import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { AIRequest } from "@/types/ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIRequest = await req.json();
    const { message, context } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
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
    
    // Build the prompt with medical context
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

    // Try different model names in order of preference
    // Available models: gemini-2.5-flash (latest), gemini-1.5-flash, gemini-1.5-pro, gemini-pro (legacy)
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
        break; // Success, exit loop
      } catch (modelError: any) {
        lastError = modelError;
        // If it's a 404 (model not found) or 503 (overloaded), try next model
        const isModelNotFound = modelError.message?.includes("404") || modelError.message?.includes("not found");
        const isOverloaded = modelError.message?.includes("503") || 
                            modelError.message?.includes("overloaded") || 
                            modelError.message?.includes("Service Unavailable");
        
        if (isModelNotFound || isOverloaded) {
          console.log(`Model ${modelName} ${isOverloaded ? 'is overloaded' : 'not available'}, trying next...`);
          continue;
        }
        // For other errors, throw immediately
        throw modelError;
      }
    }

    // If all models failed, throw the last error
    if (!aiResponse && lastError) {
      throw lastError;
    }

    // Extract suggestions based on response content (simple keyword matching)
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

    // Default suggestions if none found
    if (suggestions.length === 0) {
      suggestions.push("Emergency SOS", "Find Hospitals", "Contact Doctor");
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    });
  } catch (error: any) {
    console.error("AI error:", error);
    
    // Handle specific Gemini API errors
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
