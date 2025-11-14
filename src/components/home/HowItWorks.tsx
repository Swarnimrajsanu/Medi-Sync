"use client";

import { motion } from "framer-motion";
import { Heart, Search, Sparkles, Upload } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Describe Symptoms or Upload Reports",
    description: "Share your symptoms in detail or upload your medical reports for comprehensive analysis.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Get AI-Powered Insights",
    description: "Receive intelligent health analysis, recommended tests, and specialist suggestions from our AI assistant.",
  },
  {
    number: "03",
    icon: Search,
    title: "Compare Surgery Options",
    description: "Explore hospitals based on cost, quality ratings, and location to find the best fit for your needs.",
  },
  {
    number: "04",
    icon: Heart,
    title: "Follow Your Recovery Plan",
    description: "Track your recovery with personalized tasks, maintain daily streaks, and achieve health milestones.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            How MediSync Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A simple, four-step process to better healthcare management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <span className="text-3xl font-bold text-slate-300">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-teal-200 transform -translate-y-1/2">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-teal-200 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

