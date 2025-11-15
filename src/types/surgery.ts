export interface Surgery {
  type: string;
  minCost: number;
  maxCost: number;
  specialty: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  surgeries: Surgery[];
  distance?: number;
  image?: string;
  contact?: string;
  // Legacy fields for backward compatibility
  location?: string;
  price?: number;
  specialties?: string[];
}

export interface BookingRequest {
  budget: number;
  surgeryType?: string;
  location?: string;
  preferredDate?: string;
}

export interface BookingResponse {
  hospitals: Hospital[];
  message: string;
}

export interface SurgerySearchRequest {
  symptoms?: string;
  surgeryType?: string;
  city?: string;
  budget: number;
}

export interface SurgerySearchResponse {
  hospitals: Hospital[];
  aiRecommendations?: AIRecommendation;
  source: "database" | "ai" | "hybrid";
  message: string;
}

export interface AIRecommendation {
  estimatedCostRange: {
    min: number;
    max: number;
    currency: string;
  };
  hospitalTypes: {
    type: "government" | "trust" | "private";
    estimatedCost: {
      min: number;
      max: number;
    };
    reasoning: string;
  }[];
  risks: string[];
  recoveryTime: string;
  suggestedSpecialists: string[];
  reasoning: string;
}

