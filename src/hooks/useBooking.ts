import { BookingRequest, BookingResponse } from "@/types/surgery";
import { useState } from "react";

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchHospitals = async (request: BookingRequest): Promise<BookingResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add auth header only if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/booking", {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to search hospitals");
        return null;
      }

      return data;
    } catch (err) {
      setError("An error occurred while searching hospitals");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchHospitals, loading, error };
}

