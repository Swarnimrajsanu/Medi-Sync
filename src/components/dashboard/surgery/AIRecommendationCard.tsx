"use client";

import Card from "@/components/ui/Card";
import { AIRecommendation } from "@/types/surgery";
import { motion } from "framer-motion";
import { AlertTriangle, Building2, Clock, DollarSign, Heart, Info } from "lucide-react";

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  source: "ai" | "hybrid";
}

export default function AIRecommendationCard({
  recommendation,
  source,
}: AIRecommendationCardProps) {
  const hospitalTypeColors = {
    government: "bg-green-50 text-green-700 border-green-200",
    trust: "bg-blue-50 text-blue-700 border-blue-200",
    private: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const hospitalTypeIcons = {
    government: Building2,
    trust: Building2,
    private: Building2,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">
              {source === "ai"
                ? "AI-Generated Recommendations"
                : "AI Suggestions"}
            </h3>
            <p className="text-sm text-slate-600">
              {source === "ai"
                ? "Based on your requirements, here are estimated costs and recommendations"
                : "Additional AI-powered insights to help you make an informed decision"}
            </p>
          </div>
        </div>

        {/* Estimated Cost Range */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-teal-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900">Estimated Cost Range</h4>
          </div>
          <p className="text-2xl font-bold text-teal-600 mb-2">
            ₹{recommendation.estimatedCostRange.min.toLocaleString()} - ₹
            {recommendation.estimatedCostRange.max.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">{recommendation.reasoning}</p>
        </div>

        {/* Hospital Types */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 mb-3">Hospital Type Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.hospitalTypes.map((ht, idx) => {
              const Icon = hospitalTypeIcons[ht.type];
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${hospitalTypeColors[ht.type]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium capitalize">{ht.type}</span>
                  </div>
                  <p className="text-sm font-semibold mb-1">
                    ₹{ht.estimatedCost.min.toLocaleString()} - ₹
                    {ht.estimatedCost.max.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-90">{ht.reasoning}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risks */}
        {recommendation.risks && recommendation.risks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-slate-900">Potential Risks</h4>
            </div>
            <ul className="space-y-2">
              {recommendation.risks.map((risk, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0"></span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recovery Time */}
        {recommendation.recoveryTime && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Estimated Recovery Time</h4>
            </div>
            <p className="text-slate-700">{recommendation.recoveryTime}</p>
          </div>
        )}

        {/* Suggested Specialists */}
        {recommendation.suggestedSpecialists &&
          recommendation.suggestedSpecialists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-slate-900">Suggested Specialists</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendation.suggestedSpecialists.map((specialist, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-full border border-red-200"
                  >
                    {specialist}
                  </span>
                ))}
              </div>
            </div>
          )}
      </Card>
    </motion.div>
  );
}

