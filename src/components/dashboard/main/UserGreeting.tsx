import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface UserGreetingProps {
  userName: string | null;
  loading: boolean;
}

export default function UserGreeting({ userName, loading }: UserGreetingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Welcome back, {userName || "User"}!
              </h1>
              <p className="text-slate-600">
                Manage your health and access all MediSync features from here.
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

