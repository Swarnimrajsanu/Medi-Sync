import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError("Failed to fetch user");
      console.error(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen for storage changes (for logout from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        setUser(null);
      } else if (e.key === "token" && e.newValue) {
        fetchUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for custom logout event
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth-logout", handleLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-logout", handleLogout);
    };
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Dispatch custom event for other components
    window.dispatchEvent(new Event("auth-logout"));
  }, []);

  return { user, loading, error, logout, refetch: fetchUser };
}

