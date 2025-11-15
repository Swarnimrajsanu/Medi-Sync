"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Hospital, Surgery } from "@/types/surgery";
import { motion } from "framer-motion";
import { Calendar, DollarSign, MapPin, Phone, Star } from "lucide-react";

interface HospitalResultCardProps {
  hospital: Hospital;
  index: number;
  onBookConsultation: (hospital: Hospital) => void;
  onViewDetails: (hospital: Hospital) => void;
}

export default function HospitalResultCard({
  hospital,
  index,
  onBookConsultation,
  onViewDetails,
}: HospitalResultCardProps) {
  // Get the surgery with the lowest cost that matches budget
  const getBestSurgery = (): Surgery | null => {
    if (!hospital.surgeries || hospital.surgeries.length === 0) return null;
    return hospital.surgeries.reduce((prev, curr) =>
      curr.minCost < prev.minCost ? curr : prev
    );
  };

  const bestSurgery = getBestSurgery();
  const displayLocation = hospital.city || hospital.location || "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card hover className="transition-all duration-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-slate-900">
                {hospital.name}
              </h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-medium">{hospital.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center text-slate-600 mb-3">
              <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="text-sm">{displayLocation}</span>
              {hospital.address && (
                <span className="text-sm ml-2 text-slate-500">
                  • {hospital.address}
                </span>
              )}
              {hospital.distance && (
                <span className="text-sm ml-2 text-slate-500">
                  • {hospital.distance} km away
                </span>
              )}
            </div>

            {bestSurgery && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  <span className="text-lg font-semibold text-teal-600">
                    ₹{bestSurgery.minCost.toLocaleString()} - ₹
                    {bestSurgery.maxCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                    {bestSurgery.type}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {bestSurgery.specialty}
                  </span>
                </div>
              </div>
            )}

            {/* Legacy support for old data structure */}
            {!bestSurgery && hospital.price && (
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <span className="text-lg font-semibold text-teal-600">
                  ₹{hospital.price.toLocaleString()}
                </span>
              </div>
            )}

            {hospital.surgeries && hospital.surgeries.length > 1 && (
              <div className="mb-3">
                <p className="text-xs text-slate-600 mb-1">
                  Other available surgeries:
                </p>
                <div className="flex flex-wrap gap-2">
                  {hospital.surgeries.slice(0, 3).map((surgery, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-full"
                    >
                      {surgery.type} (₹{surgery.minCost.toLocaleString()}+)
                    </span>
                  ))}
                  {hospital.surgeries.length > 3 && (
                    <span className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-full">
                      +{hospital.surgeries.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {hospital.contact && (
              <div className="flex items-center text-slate-600 text-sm">
                <Phone className="h-4 w-4 mr-1.5" />
                <span>{hospital.contact}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end gap-2 md:min-w-[180px]">
            <Button
              variant="primary"
              size="md"
              onClick={() => onBookConsultation(hospital)}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Consultation
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onViewDetails(hospital)}
              className="w-full"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

