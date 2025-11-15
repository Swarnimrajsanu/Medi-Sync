"use client";

import { useToast } from "@/app/hook/use-toast";
import AIRecommendationCard from "@/components/dashboard/surgery/AIRecommendationCard";
import CompareHospitalsModal from "@/components/dashboard/surgery/CompareHospitalsModal";
import HospitalResultCard from "@/components/dashboard/surgery/HospitalResultCard";
import SurgeryInputCard from "@/components/dashboard/surgery/SurgeryInputCard";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  AIRecommendation,
  Hospital,
  SurgerySearchResponse,
} from "@/types/surgery";
import { motion } from "framer-motion";
import { Calendar, GitCompare } from "lucide-react";
import { useState } from "react";

export default function SurgeryPlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [symptoms, setSymptoms] = useState("");
  const [surgeryType, setSurgeryType] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [aiRecommendations, setAiRecommendations] =
    useState<AIRecommendation | null>(null);
  const [source, setSource] = useState<"database" | "ai" | "hybrid" | null>(
    null
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedHospitals, setSelectedHospitals] = useState<Hospital[]>([]);

  const handleSearch = async () => {
    if (!budget || budget <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/surgery/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: symptoms.trim() || undefined,
          surgeryType: surgeryType.trim() || undefined,
          city: city.trim() || undefined,
          budget,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.error || data.message || "Search failed";
        throw new Error(errorMessage);
      }

      // Handle success response
      const searchData = data as SurgerySearchResponse;
      setHospitals(searchData.hospitals || []);
      setAiRecommendations(searchData.aiRecommendations || null);
      setSource(searchData.source);

      toast({
        title: "Search Complete",
        description: searchData.message || `Found ${searchData.hospitals?.length || 0} result(s)`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search hospitals. Please try again.",
        variant: "error",
      });
      setHospitals([]);
      setAiRecommendations(null);
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestSurgeryType = async (symptomsText: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: `Based on these symptoms, suggest the most likely surgery type needed: ${symptomsText}. Respond with only the surgery type name, nothing else.`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestedType = data.response?.trim() || "";
        if (suggestedType) {
          setSurgeryType(suggestedType);
          toast({
            title: "Surgery Type Suggested",
            description: `Suggested: ${suggestedType}`,
            variant: "success",
          });
        }
      } else {
        throw new Error("Failed to get suggestion");
      }
    } catch (error) {
      console.error("Error suggesting surgery type:", error);
      toast({
        title: "Suggestion Failed",
        description: "Could not suggest surgery type. Please enter manually.",
        variant: "error",
      });
    }
  };

  const handleBookConsultation = (hospital: Hospital) => {
    toast({
      title: "Booking Consultation",
      description: `Redirecting to book consultation with ${hospital.name}...`,
      variant: "success",
    });
    // TODO: Implement booking flow
  };

  const handleViewDetails = (hospital: Hospital) => {
    toast({
      title: "View Details",
      description: `Showing details for ${hospital.name}...`,
      variant: "success",
    });
    // TODO: Implement details view
  };

  const handleCompareHospitals = () => {
    if (hospitals.length < 2) {
      toast({
        title: "Not Enough Hospitals",
        description: "Please select at least 2 hospitals to compare",
        variant: "error",
      });
      return;
    }
    setSelectedHospitals(hospitals.slice(0, Math.min(5, hospitals.length)));
    setShowCompareModal(true);
  };

  const handleReset = () => {
    setSymptoms("");
    setSurgeryType("");
    setCity("");
    setBudget(100000);
    setHospitals([]);
    setAiRecommendations(null);
    setSource(null);
    setHasSearched(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-24 w-full" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Surgery Planner
          </h1>
          <p className="text-slate-600">
            Find the best hospitals for your surgery based on your budget and
            requirements
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Card */}
          <div>
            <SurgeryInputCard
              symptoms={symptoms}
              setSymptoms={setSymptoms}
              surgeryType={surgeryType}
              setSurgeryType={setSurgeryType}
              city={city}
              setCity={setCity}
              budget={budget}
              setBudget={setBudget}
              onSearch={handleSearch}
              loading={loading}
              onSuggestSurgeryType={handleSuggestSurgeryType}
            />
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compare Button */}
            {hospitals.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleCompareHospitals}
                  className="w-full p-3 bg-white border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 text-teal-700 font-medium"
                >
                  <GitCompare className="h-5 w-5" />
                  Compare Hospitals ({hospitals.length})
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-32 w-full" />
                  </Card>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && hasSearched && (
              <>
                {/* Real Hospitals */}
                {hospitals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        Available Hospitals ({hospitals.length})
                      </h2>
                      {source === "database" && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          From Database
                        </span>
                      )}
                    </div>
                    {hospitals.map((hospital, index) => (
                      <HospitalResultCard
                        key={hospital.id}
                        hospital={hospital}
                        index={index}
                        onBookConsultation={handleBookConsultation}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </motion.div>
                )}

                {/* AI Recommendations */}
                {aiRecommendations && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        AI Recommendations
                      </h2>
                      {source === "ai" && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          AI Generated
                        </span>
                      )}
                      {source === "hybrid" && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          AI Suggestions
                        </span>
                      )}
                    </div>
                    <AIRecommendationCard
                      recommendation={aiRecommendations}
                      source={source === "ai" ? "ai" : "hybrid"}
                    />
                  </div>
                )}

                {/* Empty State */}
                {hospitals.length === 0 && !aiRecommendations && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          No Results Found
                        </h3>
                        <p className="text-slate-600 mb-4">
                          Try adjusting your budget, location, or surgery type
                        </p>
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          Reset Search
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </>
            )}

            {/* Initial State */}
            {!hasSearched && !loading && (
              <Card>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-slate-600">
                    Enter your symptoms, budget, and location to find the best
                    hospitals for your surgery
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compare Hospitals Modal */}
      <CompareHospitalsModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        hospitals={selectedHospitals}
      />
    </div>
  );
}
