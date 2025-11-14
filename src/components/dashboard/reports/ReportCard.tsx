import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Report } from "@/types/report";
import { motion } from "framer-motion";
import { Calendar, Eye, FileText, Image as ImageIcon, Trash2 } from "lucide-react";

interface ReportCardProps {
  report: Report;
  onPreview: (report: Report) => void;
  onDelete: (reportId: string) => Promise<void>;
  deleting: boolean;
}

export default function ReportCard({ report, onPreview, onDelete, deleting }: ReportCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isImage = report.type.startsWith("image/");
  const isPDF = report.type === "application/pdf";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPDF ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            {isPDF ? (
              <FileText className="h-6 w-6 text-red-600" />
            ) : (
              <ImageIcon className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">
              {report.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(report.uploadedAt)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
            <span>{formatFileSize(report.size)}</span>
            <span className="px-2 py-1 bg-slate-100 rounded text-slate-700">
              {isPDF ? "PDF" : report.type.split("/")[1].toUpperCase()}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(report)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(report.id)}
              isLoading={deleting}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

