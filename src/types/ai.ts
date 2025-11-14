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

