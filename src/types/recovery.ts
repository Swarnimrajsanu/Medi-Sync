export type TaskType = "medicine" | "exercise" | "followup" | "restriction";

export interface RecoveryTask {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  scheduledTime?: string;
  frequency?: "daily" | "weekly" | "as-needed";
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryPlan {
  id: string;
  userId: string;
  tasks: RecoveryTask[];
  startDate: string;
  endDate?: string;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryResponse {
  plan: RecoveryPlan;
  dailyProgress: number;
  completedToday: number;
  totalToday: number;
  badges: string[];
}

export interface UpdateTaskRequest {
  taskId: string;
  completed: boolean;
}

export interface CreatePlanRequest {
  tasks: Omit<RecoveryTask, "id" | "completed" | "completedAt" | "createdAt" | "updatedAt">[];
  startDate: string;
}

