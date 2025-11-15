"use client";

import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-teal-600 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-lg text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who are taking control of their health with AI-powered insights,
            transparent cost comparison, and comprehensive health management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="bg-black text-teal-600 hover:bg-slate-50 px-8 py-6 text-lg font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                Login to Your Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

