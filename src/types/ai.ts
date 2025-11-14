export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIRequest {
  message: string;
  context?: string;
}

export interface AIResponse {
  response: string;
  suggestions?: string[];
}

// New types for AI Health Assistant
export interface HealthAIRequest {
  symptoms: string;
  reportUrl?: string | null;
}

export interface HealthAIResponse {
  summary: string;
  suggestedTests: string[];
  specialist: string;
  estimatedSeverity: "low" | "medium" | "high";
  recommendedSurgery?: string;
  riskFactors?: string[];
  nextSteps?: string[];
}

export interface AIAnalysisHistory {
  id: string;
  symptoms: string;
  reportUrl?: string;
  analysis: HealthAIResponse;
  createdAt: string;
}
