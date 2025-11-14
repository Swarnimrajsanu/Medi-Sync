"use client";

import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Bot,
    FileText,
    Heart,
    Stethoscope,
    TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Symptom Analysis",
    description: "Describe your symptoms and receive AI-powered health insights and recommendations to guide your healthcare decisions.",
    color: "bg-purple-500",
  },
  {
    icon: Stethoscope,
    title: "Smart Surgery Planner",
    description: "Compare hospitals based on cost, quality, and location to make informed decisions about your surgical procedures.",
    color: "bg-blue-500",
  },
  {
    icon: FileText,
    title: "Report Management",
    description: "Securely upload, store, and manage all your medical reports and documents in one centralized location.",
    color: "bg-orange-500",
  },
  {
    icon: Heart,
    title: "Recovery Tracker",
    description: "Track your recovery progress with personalized tasks, maintain health streaks, and achieve recovery milestones.",
    color: "bg-green-500",
  },
  {
    icon: AlertTriangle,
    title: "Emergency SOS System",
    description: "Instantly send emergency alerts, contact assigned doctors, and find nearby hospitals in critical situations.",
    color: "bg-red-500",
  },
  {
    icon: TrendingUp,
    title: "Cost Transparency",
    description: "Compare treatment costs across multiple hospitals and make financially informed healthcare decisions.",
    color: "bg-indigo-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need for Better Healthcare
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            MediSync brings together AI-powered insights, transparent cost comparison, and comprehensive health management in one platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

