export interface Hospital {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  specialties: string[];
  distance?: number;
  image?: string;
  contact?: string;
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

