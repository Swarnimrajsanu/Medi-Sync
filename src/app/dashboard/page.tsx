"use client";

import DashboardCard from "@/components/dashboard/main/DashboardCard";
import UserGreeting from "@/components/dashboard/main/UserGreeting";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Calendar,
  CreditCard,
  FileText,
  Heart,
  Stethoscope,
  TrendingUp,
} from "lucide-react";

const dashboardModules = [
  {
    id: "ai-assistant",
    title: "AI Health Assistant",
    description: "Describe symptoms and get AI-powered health insights and recommendations",
    icon: Bot,
    href: "/dashboard/ai-assistant",
    color: "bg-purple-500",
  },
  {
    id: "surgery-planner",
    title: "Surgery Planner",
    description: "Find the best hospitals and plan your surgery based on budget and location",
    icon: Stethoscope,
    href: "/dashboard/surgery-planner",
    color: "bg-blue-500",
  },
  {
    id: "recovery",
    title: "Recovery Tracker",
    description: "Track your recovery progress, complete daily tasks, and maintain your health streak",
    icon: Heart,
    href: "/dashboard/recovery",
    color: "bg-green-500",
  },
  {
    id: "reports",
    title: "Medical Reports",
    description: "Upload, view, and manage your medical reports and documents",
    icon: FileText,
    href: "/dashboard/reports",
    color: "bg-orange-500",
  },
  {
    id: "payments",
    title: "Payments",
    description: "View payment history, manage invoices, and track your medical expenses",
    icon: CreditCard,
    href: "/dashboard/payments",
    color: "bg-indigo-500",
  },
  {
    id: "sos",
    title: "SOS Emergency",
    description: "Send emergency alerts, contact doctors, and find nearby hospitals instantly",
    icon: AlertTriangle,
    href: "/dashboard/sos",
    color: "bg-red-500",
  },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* User Greeting */}
        <div className="mb-8">
          <UserGreeting userName={user?.name || null} loading={loading} />
        </div>

        {/* Quick Access Cards */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Access</h2>
            <p className="text-slate-600">Access all MediSync features from one place</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.map((module, index) => (
                <DashboardCard
                  key={module.id}
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  href={module.href}
                  color={module.color}
                  delay={index * 0.1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Overview */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Overview</h3>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Name</span>
                  <span className="text-sm font-medium text-slate-900">{user?.name || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm font-medium text-slate-900">{user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Account Type</span>
                  <span className="text-sm font-medium text-teal-600 capitalize">
                    {user?.role || "Patient"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Tips */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Health Tips</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Track Your Recovery</p>
                  <p className="text-xs text-slate-600">
                    Complete daily tasks in Recovery Tracker to maintain your health streak.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Regular Checkups</p>
                  <p className="text-xs text-slate-600">
                    Schedule regular appointments and keep your medical reports updated.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">AI Assistant</p>
                  <p className="text-xs text-slate-600">
                    Use AI Health Assistant to get insights about your symptoms and health concerns.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
