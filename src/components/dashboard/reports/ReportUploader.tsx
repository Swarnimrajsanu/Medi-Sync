import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ReportUploaderProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  error?: string | null;
}

export default function ReportUploader({ onUpload, uploading, error }: ReportUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-600" />;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Medical Report</h3>
      
      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            id="report-upload"
            disabled={uploading}
          />
          <label
            htmlFor="report-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading
                ? "border-slate-300 bg-slate-50 cursor-not-allowed"
                : "border-teal-300 bg-teal-50 hover:bg-teal-100 hover:border-teal-400"
            }`}
          >
            <Upload className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">
              {selectedFile ? "Change File" : "Choose PDF or Image"}
            </span>
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Supported formats: PDF, JPEG, PNG (Max 10MB)
          </p>
        </div>

        {selectedFile && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-start gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                  {getFileIcon(selectedFile.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {selectedFile && (
          <Button
            onClick={handleUpload}
            isLoading={uploading}
            disabled={uploading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Report
          </Button>
        )}
      </div>
    </Card>
  );
}

