import { CreatePlanRequest, RecoveryResponse, UpdateTaskRequest } from "@/types/recovery";
import { useEffect, useState } from "react";

export function useRecovery() {
  const [plan, setPlan] = useState<RecoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRecoveryPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Allow viewing but show empty state
        setPlan(null);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/recovery", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch recovery plan");
        setLoading(false);
        return;
      }

      setPlan(data);
    } catch (err) {
      setError("An error occurred while fetching recovery plan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (request: UpdateTaskRequest) => {
    setUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to update tasks");
        return false;
      }

      const response = await fetch("/api/recovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update task");
        return false;
      }

      // Refresh the plan after update
      await fetchRecoveryPlan();
      return true;
    } catch (err) {
      setError("An error occurred while updating task");
      console.error(err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const markAllCompleted = async () => {
    setUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to update tasks");
        return false;
      }

      const response = await fetch("/api/recovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to mark all tasks as completed");
        return false;
      }

      // Refresh the plan after update
      await fetchRecoveryPlan();
      return true;
    } catch (err) {
      setError("An error occurred while updating tasks");
      console.error(err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const createPlan = async (request: CreatePlanRequest) => {
    setUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to create a recovery plan");
        return false;
      }

      const response = await fetch("/api/recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create recovery plan");
        return false;
      }

      // Refresh the plan after creation
      await fetchRecoveryPlan();
      return true;
    } catch (err) {
      setError("An error occurred while creating recovery plan");
      console.error(err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchRecoveryPlan();
  }, []);

  return {
    plan,
    loading,
    error,
    updating,
    updateTask,
    markAllCompleted,
    createPlan,
    refresh: fetchRecoveryPlan,
  };
}

