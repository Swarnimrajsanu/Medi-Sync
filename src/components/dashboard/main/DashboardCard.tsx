import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  delay?: number;
}

export default function DashboardCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  delay = 0,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link href={href}>
        <Card
          hover
          className="h-full flex flex-col group transition-all duration-200 hover:border-teal-300"
        >
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-600 flex-1">{description}</p>
          <div className="mt-4 flex items-center text-sm text-teal-600 font-medium group-hover:gap-2 transition-all">
            <span>Get Started</span>
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

