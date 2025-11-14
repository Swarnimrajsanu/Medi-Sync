"use client";

import { useToast } from "@/app/hook/use-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { useHealthAI } from "@/hooks/useHealthAI";
import { HealthAIResponse } from "@/types/ai";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Stethoscope,
  TestTube,
  TrendingUp,
  Upload,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AIAssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const { analyzeSymptoms, uploadReport, loading, uploading, error } = useHealthAI();
  const { toast } = useToast();

  const [symptoms, setSymptoms] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HealthAIResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Speech API for Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for Web Speech API support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Configure Web Speech API
        recognition.continuous = true; // Keep listening until stopped
        recognition.interimResults = true; // Show interim results for better UX
        recognition.lang = "en-US"; // Set language to English (US)
        recognition.maxAlternatives = 1; // Only get the best result

        recognition.onstart = () => {
          setIsListening(true);
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          // Update symptoms with final transcript
          if (finalTranscript) {
            setSymptoms((prev) => (prev ? prev + " " : "") + finalTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Web Speech API error:", event.error);
          setIsRecording(false);
          setIsListening(false);

          let errorMessage = "Unable to process voice input. Please try again.";
          
          switch (event.error) {
            case "not-allowed":
              errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
              break;
            case "no-speech":
              errorMessage = "No speech detected. Please try speaking again.";
              break;
            case "audio-capture":
              errorMessage = "No microphone found. Please check your microphone connection.";
              break;
            case "network":
              errorMessage = "Network error. Please check your internet connection.";
              break;
            case "aborted":
              // User stopped recording, no need to show error
              return;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }

          toast({
            title: "Voice Recognition Error",
            description: errorMessage,
            variant: "error",
          });
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        // Web Speech API not supported
        console.warn("Web Speech API is not supported in this browser");
      }
    }
  }, []);

  const handleVoiceRecord = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser does not support Web Speech API. Please use Chrome, Edge, or Safari.",
        variant: "error",
      });
      return;
    }

    if (isRecording) {
      // Stop Web Speech API recognition
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        setIsListening(false);
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    } else {
      // Start Web Speech API recognition
      try {
        // Clear any previous state
        setIsRecording(false);
        setIsListening(false);
        
        // Start recognition
        recognitionRef.current.start();
      } catch (error: any) {
        console.error("Error starting Web Speech API:", error);
        
        // Handle specific errors
        if (error.message?.includes("already started")) {
          // Recognition already running, just update state
          setIsRecording(true);
          setIsListening(true);
        } else {
          toast({
            title: "Recording Error",
            description: "Unable to start voice recording. Please check your microphone permissions.",
            variant: "error",
          });
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF and images (JPEG, PNG) are allowed",
        variant: "error",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "error",
      });
      return;
    }

    setReportFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReportPreview(null);
    }
  };

  const handleFileUpload = async () => {
    if (!reportFile) return;

    const url = await uploadReport(reportFile);
    if (url) {
      setReportUrl(url);
      toast({
        title: "Report Uploaded",
        description: "Your medical report has been uploaded successfully",
        variant: "success",
      });
    }
  };

  const handleRemoveFile = () => {
    setReportFile(null);
    setReportUrl(null);
    setReportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symptoms.trim()) {
      toast({
        title: "Symptoms Required",
        description: "Please describe your symptoms",
        variant: "error",
      });
      return;
    }

    // Upload file first if selected but not uploaded
    let finalReportUrl = reportUrl;
    if (reportFile && !reportUrl) {
      const url = await uploadReport(reportFile);
      if (url) {
        finalReportUrl = url;
        setReportUrl(url);
      }
    }

    const result = await analyzeSymptoms({
      symptoms: symptoms.trim(),
      reportUrl: finalReportUrl || null,
    });

    if (result) {
      setAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your symptoms",
        variant: "success",
      });
    } else if (error) {
      toast({
        title: "Analysis Failed",
        description: error,
        variant: "error",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Card>
            <Skeleton className="h-96 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Health Assistant</h1>
              <p className="text-slate-600">Describe your symptoms and get AI-powered health insights</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Describe Your Symptoms</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <Textarea
                    label="Symptoms Description"
                    placeholder="Describe your symptoms, when they started, their severity, and any other relevant information..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    disabled={loading}
                    className="min-h-[150px]"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleVoiceRecord}
                      disabled={loading}
                      className={isRecording ? "bg-red-50 border-red-300 text-red-700" : ""}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Voice Input
                        </>
                      )}
                    </Button>
                    {isListening && (
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        Listening...
                      </span>
                    )}
                  </div>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Medical Report (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="report-upload"
                      />
                      <label
                        htmlFor="report-upload"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm text-slate-700">
                          {reportFile ? reportFile.name : "Choose PDF or Image"}
                        </span>
                      </label>
                      {reportFile && !reportUrl && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleFileUpload}
                          isLoading={uploading}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Upload
                        </Button>
                      )}
                      {reportFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {reportPreview && (
                      <div className="mt-2">
                        <img
                          src={reportPreview}
                          alt="Report preview"
                          className="max-w-full h-auto rounded-lg border border-slate-200 max-h-48"
                        />
                      </div>
                    )}

                    {reportUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Report uploaded successfully</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Supported formats: PDF, JPEG, PNG (Max 10MB)
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={!symptoms.trim() || loading}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Analyze Symptoms
                </Button>
              </form>
            </Card>

            {/* AI Analysis Result */}
            {loading && (
              <Card>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <div className="flex items-center gap-2 mb-6">
                    <Bot className="h-5 w-5 text-teal-600" />
                    <h2 className="text-xl font-semibold text-slate-900">AI Analysis</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Summary</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
                    </div>

                    {/* Severity */}
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Estimated Severity</h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                          analysis.estimatedSeverity
                        )}`}
                      >
                        {analysis.estimatedSeverity.toUpperCase()}
                      </span>
                    </div>

                    {/* Suggested Tests */}
                    {analysis.suggestedTests && analysis.suggestedTests.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="h-4 w-4 text-teal-600" />
                          <h3 className="text-sm font-medium text-slate-700">Suggested Tests</h3>
                        </div>
                        <ul className="space-y-1">
                          {analysis.suggestedTests.map((test, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-teal-600 mt-0.5">•</span>
                              <span>{test}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Specialist */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-medium text-slate-700">Recommended Specialist</h3>
                      </div>
                      <p className="text-sm text-slate-600">{analysis.specialist}</p>
                    </div>

                    {/* Recommended Surgery */}
                    {analysis.recommendedSurgery && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <h3 className="text-sm font-medium text-slate-700">Recommended Surgery</h3>
                        </div>
                        <p className="text-sm text-slate-600">{analysis.recommendedSurgery}</p>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <h3 className="text-sm font-medium text-slate-700">Risk Factors</h3>
                        </div>
                        <ul className="space-y-1">
                          {analysis.riskFactors.map((risk, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-orange-600 mt-0.5">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Steps */}
                    {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-teal-600" />
                          <h3 className="text-sm font-medium text-slate-700">Next Steps</h3>
                        </div>
                        <ul className="space-y-1">
                          {analysis.nextSteps.map((step, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-teal-600 mt-0.5">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                          <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and is not a
                          substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of
                          your physician or other qualified health provider with any questions you may have regarding a
                          medical condition.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">1.</span>
                  <span>Describe your symptoms in detail</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">2.</span>
                  <span>Optionally upload medical reports</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">3.</span>
                  <span>Get AI-powered analysis and recommendations</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">4.</span>
                  <span>Consult with a healthcare professional</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-teal-900 mb-1">Important Notice</h4>
                    <p className="text-xs text-teal-800">
                      For medical emergencies, call 108 immediately or use the SOS feature in the dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

