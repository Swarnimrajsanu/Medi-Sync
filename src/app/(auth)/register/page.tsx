
// app/(auth)/register/page.tsx
"use client";

import { useToast } from "@/app/hook/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = typeof data?.error === "string" ? data.error : "Registration failed";
        setError(errorMsg);
        toast({
          title: "Registration Failed",
          description: errorMsg || "Please try again",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully",
        variant: "success",
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm block mb-1 font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm block mb-1 font-medium">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Must be at least 6 characters
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
