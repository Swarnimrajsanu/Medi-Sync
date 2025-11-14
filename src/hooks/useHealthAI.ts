import { HealthAIRequest, HealthAIResponse } from "@/types/ai";
import { useState } from "react";

export function useHealthAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadReport = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to continue");
        return null;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload report");
        return null;
      }

      return data.url || data.reportUrl || null;
    } catch (err) {
      setError("An error occurred while uploading report");
      console.error(err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const analyzeSymptoms = async (request: HealthAIRequest): Promise<HealthAIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to continue");
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
        setError(data.error || "Failed to get AI analysis");
        return null;
      }

      return data as HealthAIResponse;
    } catch (err) {
      setError("An error occurred while communicating with AI");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeSymptoms, uploadReport, loading, uploading, error };
}

