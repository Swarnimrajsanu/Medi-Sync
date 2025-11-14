export interface SOSRequest {
  message?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  emergencyType?: "medical" | "accident" | "other";
}

export interface SOSResponse {
  message: string;
  alertId: string;
  timestamp: string;
  contactsNotified?: number;
  doctorPhone?: string;
  doctorName?: string;
}
