import { Report } from "@/types/report";
import { useEffect, useState } from "react";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Allow viewing but show empty state
        setReports([]);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/report", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch reports");
        setLoading(false);
        return;
      }

      setReports(data.reports || []);
    } catch (err) {
      setError("An error occurred while fetching reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadReport = async (file: File): Promise<Report | null> => {
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

      // Refresh reports list
      await fetchReports();
      return data as Report;
    } catch (err) {
      setError("An error occurred while uploading report");
      console.error(err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteReport = async (reportId: string): Promise<boolean> => {
    setDeleting(reportId);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to continue");
        return false;
      }

      const response = await fetch(`/api/report?id=${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete report");
        return false;
      }

      // Refresh reports list
      await fetchReports();
      return true;
    } catch (err) {
      setError("An error occurred while deleting report");
      console.error(err);
      return false;
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    uploading,
    deleting,
    uploadReport,
    deleteReport,
    refresh: fetchReports,
  };
}

