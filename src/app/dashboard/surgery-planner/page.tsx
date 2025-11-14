"use client";

import { useToast } from "@/app/hook/use-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { Hospital } from "@/types/surgery";
import { motion } from "framer-motion";
import { Calendar, DollarSign, MapPin, Phone, Star } from "lucide-react";
import { useState } from "react";

export default function SurgeryPlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const { searchHospitals, loading: searchLoading, error } = useBooking();
  const { toast } = useToast();

  const [budget, setBudget] = useState("");
  const [surgeryType, setSurgeryType] = useState("");
  const [location, setLocation] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetNum = parseFloat(budget);
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "error",
      });
      return;
    }

    const result = await searchHospitals({
      budget: budgetNum,
      surgeryType: surgeryType.trim() || undefined,
      location: location.trim() || undefined,
    });

    if (result) {
      setHospitals(result.hospitals);
      setHasSearched(true);
      toast({
        title: "Search Complete",
        description: result.message,
        variant: "success",
      });
    } else if (error) {
      toast({
        title: "Search Failed",
        description: error,
        variant: "error",
      });
    }
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
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Surgery Planner</h1>
          <p className="text-slate-600 mb-6">
            Enter your budget and preferences to find the best hospitals for your surgery
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Search Criteria</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Budget (₹)"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter your budget"
                  min="0"
                  step="1000"
                  required
                />

                <Input
                  label="Surgery Type (Optional)"
                  type="text"
                  value={surgeryType}
                  onChange={(e) => setSurgeryType(e.target.value)}
                  placeholder="e.g., Cardiac Surgery"
                />

                <Input
                  label="Location (Optional)"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Delhi, Mumbai"
                />

                <Button
                  type="submit"
                  isLoading={searchLoading}
                  className="w-full"
                  disabled={!budget}
                >
                  Search Hospitals
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Results */}
          <div className="lg:col-span-2">
            {searchLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-32 w-full" />
                  </Card>
                ))}
              </div>
            ) : hasSearched && hospitals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Hospitals Found
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Try adjusting your budget or search criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBudget("");
                        setSurgeryType("");
                        setLocation("");
                        setHospitals([]);
                        setHasSearched(false);
                      }}
                    >
                      Reset Search
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : hospitals.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {hospitals.map((hospital, index) => (
                  <motion.div
                    key={hospital.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card hover>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-slate-900">
                              {hospital.name}
                            </h3>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-5 w-5 fill-current" />
                              <span className="font-medium">{hospital.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center text-slate-600 mb-3">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            <span>{hospital.location}</span>
                            {hospital.distance && (
                              <span className="ml-2 text-sm">• {hospital.distance} km away</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-teal-600" />
                            <span className="text-lg font-semibold text-teal-600">
                              ₹{hospital.price.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {hospital.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>

                          {hospital.contact && (
                            <div className="flex items-center text-slate-600 text-sm">
                              <Phone className="h-4 w-4 mr-1.5" />
                              <span>{hospital.contact}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                          <Button variant="primary" size="md">
                            Book Appointment
                          </Button>
                          <Button variant="outline" size="md">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-slate-600">
                    Enter your budget and preferences to find the best hospitals for your surgery
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

