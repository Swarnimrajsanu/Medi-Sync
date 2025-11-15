"use client";

import { useToast } from "@/app/hook/use-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SurgeryInputCardProps {
  symptoms: string;
  setSymptoms: (value: string) => void;
  surgeryType: string;
  setSurgeryType: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  budget: number;
  setBudget: (value: number) => void;
  onSearch: () => void;
  loading: boolean;
  onSuggestSurgeryType?: (symptoms: string) => Promise<void>;
}

export default function SurgeryInputCard({
  symptoms,
  setSymptoms,
  surgeryType,
  setSurgeryType,
  city,
  setCity,
  budget,
  setBudget,
  onSearch,
  loading,
  onSuggestSurgeryType,
}: SurgeryInputCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          setSymptoms(symptoms + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setIsListening(false);

          let errorMessage = "Speech recognition error occurred";
          if (event.error === "no-speech") {
            errorMessage = "No speech detected. Please try again.";
          } else if (event.error === "audio-capture") {
            errorMessage = "No microphone found. Please check your device.";
          } else if (event.error === "not-allowed") {
            errorMessage = "Microphone permission denied. Please enable it in your browser settings.";
          }

          toast({
            title: "Voice Input Error",
            description: errorMessage,
            variant: "error",
          });
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [symptoms, toast]);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Input Unavailable",
        description: "Your browser does not support speech recognition",
        variant: "error",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error: any) {
        console.error("Error starting recognition:", error);
        toast({
          title: "Voice Input Error",
          description: "Failed to start voice input. Please try again.",
          variant: "error",
        });
      }
    }
  };

  const handleSuggestSurgeryType = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Symptoms Required",
        description: "Please enter symptoms to get surgery type suggestions",
        variant: "error",
      });
      return;
    }

    if (onSuggestSurgeryType) {
      await onSuggestSurgeryType(symptoms);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Search Criteria
      </h2>
      <div className="space-y-4">
        {/* Symptoms Input with Voice */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Patient Symptoms
          </label>
          <div className="relative">
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe your symptoms or medical condition..."
              rows={4}
              className="pr-12"
            />
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
          {isListening && (
            <p className="mt-1 text-xs text-teal-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Listening...
            </p>
          )}
          {symptoms.trim() && (
            <button
              type="button"
              onClick={handleSuggestSurgeryType}
              className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Auto-suggest surgery type from symptoms
            </button>
          )}
        </div>

        {/* Surgery Type */}
        <Input
          label="Surgery Type (Optional)"
          type="text"
          value={surgeryType}
          onChange={(e) => setSurgeryType(e.target.value)}
          placeholder="e.g., Cardiac Surgery, Orthopedic Surgery"
        />

        {/* City/Location */}
        <Input
          label="City / Location"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g., Delhi, Mumbai, Bangalore"
        />

        {/* Budget Slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Budget: ₹{budget.toLocaleString()}
          </label>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>₹10K</span>
            <span>₹10L</span>
          </div>
        </div>

        {/* Search Button */}
        <Button
          type="button"
          onClick={onSearch}
          isLoading={loading}
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={!budget || budget <= 0}
        >
          Search Hospitals
        </Button>
      </div>
    </Card>
  );
}

