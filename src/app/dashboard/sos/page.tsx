"use client";

import { useToast } from "@/app/hook/use-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { useSOS } from "@/hooks/useSOS";
import { AIMessage } from "@/types/ai";
import { motion } from "framer-motion";
import { AlertTriangle, Bot, Building2, CheckCircle2, Clock, MapPin, Mic, MicOff, Phone, Send, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SOSPage() {
  const { user, loading: authLoading } = useAuth();
  const { sendEmergencyAlert, loading: sosLoading, error } = useSOS();
  const { sendMessage: sendAIMessage, loading: aiLoading, error: aiError } = useAI();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNearbyHospitalsModal, setShowNearbyHospitalsModal] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [emergencyType, setEmergencyType] = useState<"medical" | "accident" | "other">("medical");
  const [emergencyDetails, setEmergencyDetails] = useState("");
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [nearbyHospitalsLoading, setNearbyHospitalsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const [lastAlert, setLastAlert] = useState<{
    alertId: string;
    timestamp: string;
    contactsNotified: number;
    doctorPhone?: string;
    doctorName?: string;
  } | null>(null);

  // Initialize Speech Recognition and Synthesis
  useEffect(() => {
    // Check browser support
    if (typeof window !== "undefined") {
      // Speech Recognition (Speech-to-Text)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAiInput(transcript);
          setIsRecording(false);
          setIsListening(false);
          // Auto-send after voice input
          setTimeout(() => {
            handleAISend(new Event("submit") as any);
          }, 100);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setIsListening(false);
          if (event.error === "not-allowed") {
            toast({
              title: "Microphone Permission Denied",
              description: "Please allow microphone access to use voice chat",
              variant: "error",
            });
          } else {
            toast({
              title: "Voice Recognition Error",
              description: "Unable to process voice input. Please try typing instead.",
              variant: "error",
            });
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      // Speech Synthesis (Text-to-Speech)
      if ("speechSynthesis" in window) {
        synthesisRef.current = window.speechSynthesis;
      }
    }

    fetchLocation();
    // Initialize AI chat with welcome message
    setAiMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your MediSync AI assistant. I can help you with emergency situations, finding hospitals, understanding symptoms, and more. How can I assist you today?",
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Unavailable",
        description: "Your browser does not support geolocation",
        variant: "error",
      });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
          variant: "error",
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSOSClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to send emergency alerts",
        variant: "error",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSOS = async () => {
    setShowConfirmModal(false);

    if (!user) {
      return;
    }

    const result = await sendEmergencyAlert({
      latitude: location?.lat,
      longitude: location?.lng,
      location: location?.address,
      emergencyType,
      message: emergencyDetails.trim() || undefined,
    });

    if (result) {
      setAlertSent(true);
      setLastAlert({
        alertId: result.alertId,
        timestamp: result.timestamp,
        contactsNotified: result.contactsNotified || 0,
        doctorPhone: result.doctorPhone,
        doctorName: result.doctorName,
      });
      toast({
        title: "Emergency Alert Sent",
        description: result.message,
        variant: "success",
      });
      
      // Reset alert sent state after 10 seconds
      setTimeout(() => {
        setAlertSent(false);
      }, 10000);
    } else if (error) {
      toast({
        title: "Alert Failed",
        description: error,
        variant: "error",
      });
    }
  };

  const handleCallDoctor = () => {
    if (lastAlert?.doctorPhone) {
      window.open(`tel:${lastAlert.doctorPhone}`, "_self");
    } else {
      toast({
        title: "Doctor Not Available",
        description: "No assigned doctor found. Please send an emergency alert first.",
        variant: "error",
      });
    }
  };

  const handleFindNearbyHospitals = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services to find nearby hospitals",
        variant: "error",
      });
      return;
    }

    setNearbyHospitalsLoading(true);
    setShowNearbyHospitalsModal(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to find nearby hospitals",
          variant: "error",
        });
        return;
      }

      setNearbyHospitals(data.hospitals || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while finding nearby hospitals",
        variant: "error",
      });
    } finally {
      setNearbyHospitalsLoading(false);
    }
  };

  const handleAISend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!aiInput.trim() || aiLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: aiInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    const inputText = aiInput.trim();
    setAiInput("");

    const context = lastAlert ? `Recent emergency alert sent: ${lastAlert.alertId}` : undefined;
    const response = await sendAIMessage({
      message: inputText,
      context,
    });

    if (response) {
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, aiMessage]);
      
      // Speak the AI response if speech is enabled
      if (speechEnabled && synthesisRef.current) {
        speakText(response.response);
      }
    } else if (aiError) {
      toast({
        title: "AI Error",
        description: aiError,
        variant: "error",
      });
    }
  };

  const handleVoiceRecord = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser does not support voice recognition",
        variant: "error",
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      // Start recording
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast({
          title: "Recording Error",
          description: "Unable to start voice recording",
          variant: "error",
        });
      }
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;

    // Stop any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    utterance.onend = () => {
      console.log("Speech finished");
    };

    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error);
    };

    synthesisRef.current.speak(utterance);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (synthesisRef.current && !speechEnabled) {
      synthesisRef.current.cancel();
    }
  };

  const handleAISuggestion = (suggestion: string) => {
    if (suggestion === "Send SOS Alert") {
      handleSOSClick();
    } else if (suggestion === "Find Nearby Hospitals") {
      handleFindNearbyHospitals();
    } else if (suggestion === "Call Emergency Services") {
      window.open("tel:108", "_self");
    } else if (suggestion === "Contact Doctor" && lastAlert?.doctorPhone) {
      handleCallDoctor();
    } else {
      setAiInput(suggestion);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <Skeleton className="h-64 w-full" />
            </Card>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <Skeleton className="h-32 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Emergency SOS</h1>
          <p className="text-slate-600">
            Send an emergency alert to notify your doctor and emergency contacts immediately
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large Emergency Button - Center Focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="text-center p-8">
              <motion.div
                animate={alertSent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-16 w-16 text-red-600" />
                  </div>
                  {!alertSent && (
                    <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-75" />
                  )}
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Emergency Alert</h2>
              <p className="text-sm text-slate-600 mb-8">
                Press the button below to send an immediate emergency alert
              </p>

              <Button
                variant="primary"
                size="lg"
                onClick={handleSOSClick}
                isLoading={sosLoading}
                disabled={alertSent}
                className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white text-xl font-bold py-6 shadow-lg hover:shadow-xl transition-all"
              >
                {sosLoading ? (
                  "Sending..."
                ) : alertSent ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 mr-2" />
                    Alert Sent
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 mr-2" />
                    Send SOS
                  </>
                )}
              </Button>

              {locationLoading && (
                <p className="mt-4 text-xs text-slate-500">Fetching your location...</p>
              )}

              {location && !locationLoading && (
                <p className="mt-4 text-xs text-slate-600 flex items-center justify-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location ready
                </p>
              )}
            </Card>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Last SOS Alert Info */}
            {lastAlert && (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Last Emergency Alert</h3>
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Sent</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="text-sm">
                      {new Date(lastAlert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Phone className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="text-sm">
                      {lastAlert.contactsNotified} contacts notified
                    </span>
                  </div>
                  {lastAlert.doctorName && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-900 mb-2">Assigned Doctor</p>
                      <p className="text-sm text-slate-600 mb-3">{lastAlert.doctorName}</p>
                      {lastAlert.doctorPhone && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCallDoctor}
                          className="w-full bg-teal-600 hover:bg-teal-700"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Doctor ({lastAlert.doctorPhone})
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500">Alert ID: {lastAlert.alertId}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Patient Info Card */}
            {user && (
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Patient Name</p>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  {location && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Location</p>
                      <p className="text-sm text-slate-600">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* AI Assistant Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <Bot className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">AI Health Assistant</h3>
                    <p className="text-xs text-slate-500">Get instant help and guidance</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIChat(!showAIChat)}
                >
                  {showAIChat ? <X className="h-4 w-4" /> : "Open Chat"}
                </Button>
              </div>

              {showAIChat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-slate-200 rounded-lg bg-white"
                >
                  {/* Chat Messages */}
                  <div className="h-64 overflow-y-auto p-4 space-y-4">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-lg px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAISend} className="border-t border-slate-200 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Ask me anything about your health..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        disabled={aiLoading || isRecording}
                      />
                      <Button
                        type="button"
                        variant={isRecording ? "primary" : "outline"}
                        size="sm"
                        onClick={handleVoiceRecord}
                        disabled={aiLoading}
                        className={isRecording ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : ""}
                        title={isRecording ? "Stop recording" : "Start voice recording"}
                      >
                        {isRecording ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleSpeech}
                        title={speechEnabled ? "Disable voice responses" : "Enable voice responses"}
                      >
                        {speechEnabled ? (
                          <Volume2 className="h-4 w-4 text-teal-600" />
                        ) : (
                          <VolumeX className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={aiLoading}
                        disabled={!aiInput.trim() || isRecording}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {isListening && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span>Listening...</span>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {!showAIChat && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-3">
                    Ask questions about emergencies, symptoms, medications, or finding healthcare facilities.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAIChat(true)}
                    className="w-full"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Start Chat with AI
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open("tel:108", "_self");
                  }}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call 108 (Emergency)
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchLocation}
                  isLoading={locationLoading}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Refresh Location
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFindNearbyHospitals}
                  isLoading={nearbyHospitalsLoading}
                  disabled={!location}
                  className="w-full"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Find Nearby Hospitals
                </Button>
                {lastAlert?.doctorPhone && (
                  <Button
                    variant="primary"
                    onClick={handleCallDoctor}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Assigned Doctor
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal with Emergency Type Form */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Emergency Alert"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Are you sure you want to send an emergency alert?
              </h3>
              <p className="text-sm text-slate-600">
                This will immediately notify your emergency contacts and assigned doctor. 
                Help will be dispatched to your location.
              </p>
            </div>
          </div>

          {/* Emergency Type Form */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Emergency Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["medical", "accident", "other"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEmergencyType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      emergencyType === type
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Emergency Details (Optional)
              </label>
              <textarea
                value={emergencyDetails}
                onChange={(e) => setEmergencyDetails(e.target.value)}
                placeholder="Describe your emergency situation..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>

          {user && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-slate-700">Alert will be sent for:</p>
              <p className="text-sm text-slate-900">{user.name}</p>
              {location && (
                <p className="text-xs text-slate-600">
                  Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setEmergencyDetails("");
                setEmergencyType("medical");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSOS}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nearby Hospitals Modal */}
      <Modal
        isOpen={showNearbyHospitalsModal}
        onClose={() => setShowNearbyHospitalsModal(false)}
        title="Nearby Hospitals"
      >
        <div className="space-y-4">
          {nearbyHospitalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : nearbyHospitals.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No nearby hospitals found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nearbyHospitals.map((hospital) => (
                <Card key={hospital.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{hospital.name}</h4>
                    {hospital.distance && (
                      <span className="text-xs text-slate-500">{hospital.distance} km away</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hospital.location}
                  </p>
                  {hospital.contact && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(`tel:${hospital.contact}`, "_self")}
                      className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
                    >
                      <Phone className="h-3 w-3 mr-2" />
                      Call {hospital.contact}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
