import { AIRequest, AIResponse } from "@/types/ai";
import { useState } from "react";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (request: AIRequest): Promise<AIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to use AI assistant");
        return null;
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to get AI response");
        return null;
      }

      return data;
    } catch (err) {
      setError("An error occurred while communicating with AI");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}

