import Modal from "@/components/ui/Modal";
import { Report } from "@/types/report";
import { Download, FileText, Image as ImageIcon, X } from "lucide-react";

interface PreviewModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewModal({ report, isOpen, onClose }: PreviewModalProps) {
  if (!report) return null;

  const isImage = report.type.startsWith("image/");
  const isPDF = report.type === "application/pdf";

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = report.url;
    link.download = report.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {isPDF ? (
              <FileText className="h-5 w-5 text-red-600" />
            ) : (
              <ImageIcon className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{report.name}</h3>
              <p className="text-xs text-slate-600">
                Uploaded on {new Date(report.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-50 rounded-lg p-4">
          {isImage ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={report.url}
                alt={report.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPDF ? (
            <div className="w-full h-[70vh]">
              <iframe
                src={report.url}
                className="w-full h-full rounded-lg border border-slate-200"
                title={report.name}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] text-slate-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                >
                  Download to view
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

