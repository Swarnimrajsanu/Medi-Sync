"use client";

import { useToast } from "@/app/hook/use-toast";
import PreviewModal from "@/components/dashboard/reports/PreviewModal";
import ReportCard from "@/components/dashboard/reports/ReportCard";
import ReportUploader from "@/components/dashboard/reports/ReportUploader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useReports } from "@/hooks/useReports";
import { Report } from "@/types/report";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const { reports, loading, error, uploading, deleting, uploadReport, deleteReport } = useReports();
  const { toast } = useToast();
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleUpload = async (file: File) => {
    const result = await uploadReport(file);
    if (result) {
      toast({
        title: "Upload Successful",
        description: "Your medical report has been uploaded successfully",
        variant: "success",
      });
    } else {
      toast({
        title: "Upload Failed",
        description: error || "Failed to upload report. Please try again.",
        variant: "error",
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    const success = await deleteReport(reportId);
    if (success) {
      toast({
        title: "Report Deleted",
        description: "The report has been deleted successfully",
        variant: "success",
      });
    } else {
      toast({
        title: "Delete Failed",
        description: error || "Failed to delete report. Please try again.",
        variant: "error",
      });
    }
  };

  const handlePreview = (report: Report) => {
    setPreviewReport(report);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Medical Reports</h1>
              <p className="text-slate-600">Upload, view, and manage your medical documents</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <ReportUploader
              onUpload={handleUpload}
              uploading={uploading}
              error={error}
            />
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Your Reports ({reports.length})
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </Card>
                  ))}
                </div>
              ) : error && reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reports Yet</h3>
                  <p className="text-slate-600">
                    Upload your first medical report to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onPreview={handlePreview}
                      onDelete={handleDelete}
                      deleting={deleting === report.id}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        <PreviewModal
          report={previewReport}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewReport(null);
          }}
        />
      </div>
    </div>
  );
}

