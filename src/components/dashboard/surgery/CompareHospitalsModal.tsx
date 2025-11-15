"use client";

import Modal from "@/components/ui/Modal";
import { Hospital } from "@/types/surgery";
import { motion } from "framer-motion";
import { DollarSign, MapPin, Star } from "lucide-react";

interface CompareHospitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
}

export default function CompareHospitalsModal({
  isOpen,
  onClose,
  hospitals,
}: CompareHospitalsModalProps) {
  if (hospitals.length === 0) return null;

  // Get all unique surgery types across all hospitals
  const allSurgeryTypes = Array.from(
    new Set(
      hospitals.flatMap((h) =>
        h.surgeries?.map((s) => s.type) || []
      )
    )
  );

  const getSurgeryCost = (hospital: Hospital, surgeryType: string) => {
    const surgery = hospital.surgeries?.find(
      (s) => s.type.toLowerCase() === surgeryType.toLowerCase()
    );
    if (surgery) {
      return `₹${surgery.minCost.toLocaleString()} - ₹${surgery.maxCost.toLocaleString()}`;
    }
    // Legacy support
    if (hospital.price) {
      return `₹${hospital.price.toLocaleString()}`;
    }
    return "N/A";
  };

  const displayLocation = (hospital: Hospital) => {
    return hospital.city || hospital.location || "N/A";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Hospitals" size="xl">
      <div className="max-h-[70vh] overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-900">
                  Hospital
                </th>
                <th className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                  Rating
                </th>
                <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-900">
                  Location
                </th>
                {allSurgeryTypes.slice(0, 3).map((type) => (
                  <th
                    key={type}
                    className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-900"
                  >
                    {type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital, idx) => (
                <motion.tr
                  key={hospital.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="border border-slate-300 px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {hospital.name}
                    </div>
                    {hospital.contact && (
                      <div className="text-xs text-slate-600 mt-1">
                        {hospital.contact}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">
                        {hospital.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="border border-slate-300 px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-700 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{displayLocation(hospital)}</span>
                    </div>
                    {hospital.address && (
                      <div className="text-xs text-slate-500 mt-1">
                        {hospital.address}
                      </div>
                    )}
                  </td>
                  {allSurgeryTypes.slice(0, 3).map((type) => (
                    <td
                      key={type}
                      className="border border-slate-300 px-4 py-3 text-center"
                    >
                      <div className="flex items-center justify-center gap-1 text-teal-600 text-sm font-medium">
                        <DollarSign className="h-3 w-3" />
                        <span>{getSurgeryCost(hospital, type)}</span>
                      </div>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {hospitals.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Costs are estimates and may vary. Please
              contact hospitals directly for accurate pricing and availability.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

