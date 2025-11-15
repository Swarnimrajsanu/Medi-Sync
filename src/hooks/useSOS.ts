import { SOSRequest, SOSResponse } from "@/types/sos";
import { useState } from "react";

export function useSOS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmergencyAlert = async (request: SOSRequest): Promise<SOSResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to send emergency alerts");
        return null;
      }

      const response = await fetch("/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send emergency alert");
        return null;
      }

      return data;
    } catch (err) {
      setError("An error occurred while sending emergency alert");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmergencyAlert, loading, error };
}

