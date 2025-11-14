import RecoveryPlan from "@/app/model/Recovery.model";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/dbConnect";
import { CreatePlanRequest, RecoveryResponse, UpdateTaskRequest } from "@/types/recovery";
import { NextResponse } from "next/server";

// Helper function to calculate daily progress
function calculateDailyProgress(tasks: any[], currentDate: Date): {
  completed: number;
  total: number;
  percentage: number;
} {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const dailyTasks = tasks.filter((task) => {
    if (task.frequency === "daily") return true;
    if (task.frequency === "weekly") {
      // Check if task should be done today based on start date
      return true; // Simplified - in production, calculate based on schedule
    }
    return task.frequency === "as-needed";
  });

  const completedToday = dailyTasks.filter((task) => {
    if (!task.completed) return false;
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }
    // Check completedDates array
    if (task.completedDates && task.completedDates.length > 0) {
      return task.completedDates.some((date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    }
    return false;
  }).length;

  return {
    completed: completedToday,
    total: dailyTasks.length,
    percentage: dailyTasks.length > 0 ? (completedToday / dailyTasks.length) * 100 : 0,
  };
}

// Helper function to calculate badges
function calculateBadges(plan: any): string[] {
  const badges: string[] = [];
  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceStart >= 7) badges.push("Week 1 Complete");
  if (daysSinceStart >= 14) badges.push("Week 2 Complete");
  if (daysSinceStart >= 30) badges.push("Month 1 Complete");

  if (plan.currentStreak >= 3) badges.push("3 Day Streak");
  if (plan.currentStreak >= 7) badges.push("Week Streak");
  if (plan.currentStreak >= 30) badges.push("Month Streak");

  const allCompleted = plan.tasks.every((task: any) => task.completed);
  if (allCompleted) badges.push("Perfect Day");

  const medicineTasks = plan.tasks.filter((t: any) => t.type === "medicine");
  const medicineCompleted = medicineTasks.every((t: any) => t.completed);
  if (medicineCompleted && medicineTasks.length > 0) badges.push("Medicine Master");

  return badges;
}

// GET - Fetch recovery plan
export async function GET(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let plan = await RecoveryPlan.findOne({ userId: decoded.id }).lean();

    // If no plan exists, return empty response
    if (!plan) {
      return NextResponse.json({
        plan: null,
        dailyProgress: 0,
        completedToday: 0,
        totalToday: 0,
        badges: [],
      });
    }

    // Calculate daily progress
    const progress = calculateDailyProgress(plan.tasks, new Date());
    const badges = calculateBadges(plan);

    // Transform to match RecoveryResponse interface
    const response: RecoveryResponse = {
      plan: {
        id: plan._id.toString(),
        userId: plan.userId.toString(),
        tasks: plan.tasks.map((task: any) => ({
          id: task._id?.toString() || Math.random().toString(),
          type: task.type,
          title: task.title,
          description: task.description,
          completed: task.completed,
          completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
          scheduledTime: task.scheduledTime,
          frequency: task.frequency || "daily",
          createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : new Date().toISOString(),
        })),
        startDate: new Date(plan.startDate).toISOString(),
        endDate: plan.endDate ? new Date(plan.endDate).toISOString() : undefined,
        currentStreak: plan.currentStreak || 0,
        longestStreak: plan.longestStreak || 0,
        createdAt: new Date(plan.createdAt).toISOString(),
        updatedAt: new Date(plan.updatedAt).toISOString(),
      },
      dailyProgress: progress.percentage,
      completedToday: progress.completed,
      totalToday: progress.total,
      badges,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Recovery GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create recovery plan
export async function POST(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if plan already exists
    const existingPlan = await RecoveryPlan.findOne({ userId: decoded.id });
    if (existingPlan) {
      return NextResponse.json({ error: "Recovery plan already exists" }, { status: 400 });
    }

    const body: CreatePlanRequest = await req.json();
    const { tasks, startDate } = body;

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: "At least one task is required" }, { status: 400 });
    }

    const plan = await RecoveryPlan.create({
      userId: decoded.id,
      tasks: tasks.map((task) => ({
        type: task.type,
        title: task.title,
        description: task.description,
        completed: false,
        scheduledTime: task.scheduledTime,
        frequency: task.frequency || "daily",
        completedDates: [],
      })),
      startDate: startDate ? new Date(startDate) : new Date(),
      currentStreak: 0,
      longestStreak: 0,
    });

    const progress = calculateDailyProgress(plan.tasks, new Date());
    const badges = calculateBadges(plan);

    return NextResponse.json({
      plan: {
        id: plan.id ? plan.id.toString() : (plan._id ? plan._id.toString() : undefined),
        userId: plan.userId.toString(),
        tasks: plan.tasks.map((task: any, index: number) => ({
          id: index.toString(),
          type: task.type,
          title: task.title,
          description: task.description,
          completed: task.completed,
          scheduledTime: task.scheduledTime,
          frequency: task.frequency || "daily",
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
        })),
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate ? plan.endDate.toISOString() : undefined,
        currentStreak: plan.currentStreak,
        longestStreak: plan.longestStreak,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      },
      dailyProgress: progress.percentage,
      completedToday: progress.completed,
      totalToday: progress.total,
      badges,
    });
  } catch (error: any) {
    console.error("Recovery POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update task completion
export async function PATCH(req: Request) {
  try {
    await connectDB();
    
    const decoded: any = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateTaskRequest & { markAll?: boolean } = await req.json();

    const plan = await RecoveryPlan.findOne({ userId: decoded.id });
    if (!plan) {
      return NextResponse.json({ error: "Recovery plan not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (body.markAll) {
      // Mark all tasks as completed for today
      plan.tasks.forEach((task: any) => {
        task.completed = true;
        task.completedAt = new Date();
        
        // Add to completedDates if not already there
        const todayStr = today.toISOString();
        const alreadyCompleted = task.completedDates.some((date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
        
        if (!alreadyCompleted) {
          task.completedDates.push(today);
        }
      });

      // Update streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const hadStreakYesterday = plan.tasks.some((task: any) => {
        return task.completedDates.some((date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === yesterday.getTime();
        });
      });

      if (hadStreakYesterday) {
        plan.currentStreak += 1;
      } else {
        plan.currentStreak = 1;
      }

      if (plan.currentStreak > plan.longestStreak) {
        plan.longestStreak = plan.currentStreak;
      }
    } else {
      // Update specific task
      const { taskId, completed } = body;
      
      if (!taskId) {
        return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
      }

      // Find task by index (since we use index-based IDs in response)
      const taskIndex = parseInt(taskId);
      let task: any;
      
      if (!isNaN(taskIndex) && taskIndex >= 0 && taskIndex < plan.tasks.length) {
        task = plan.tasks[taskIndex];
      } else {
        // Fallback: try to find by _id or any other identifier
        task = plan.tasks.find((t: any, index: number) => {
          const tId = t._id?.toString() || index.toString();
          return tId === taskId || index.toString() === taskId;
        });
      }
      
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      task.completed = completed;
      
      if (completed) {
        task.completedAt = new Date();
        
        // Add to completedDates if not already there
        const alreadyCompleted = task.completedDates.some((date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
        
        if (!alreadyCompleted) {
          task.completedDates.push(today);
        }
      } else {
        // Remove from completedDates for today
        task.completedDates = task.completedDates.filter((date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() !== today.getTime();
        });
        task.completedAt = undefined;
      }

      // Update streak based on all tasks
      const allCompletedToday = plan.tasks.every((t: any) => {
        return t.completedDates.some((date: Date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      });

      if (allCompletedToday) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const hadStreakYesterday = plan.tasks.some((task: any) => {
          return task.completedDates.some((date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === yesterday.getTime();
          });
        });

        if (hadStreakYesterday) {
          plan.currentStreak += 1;
        } else {
          plan.currentStreak = 1;
        }

        if (plan.currentStreak > plan.longestStreak) {
          plan.longestStreak = plan.currentStreak;
        }
      }
    }

    await plan.save();

    // Return updated plan
    const progress = calculateDailyProgress(plan.tasks, new Date());
    const badges = calculateBadges(plan);

    return NextResponse.json({
      plan: {
        id: String((plan as any)._id),
        userId: String((plan as any).userId),
        tasks: plan.tasks.map((task: any, index: number) => ({
          id: index.toString(),
          type: task.type,
          title: task.title,
          description: task.description,
          completed: task.completed,
          completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
          scheduledTime: task.scheduledTime,
          frequency: task.frequency || "daily",
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
        })),
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate ? plan.endDate.toISOString() : undefined,
        currentStreak: plan.currentStreak,
        longestStreak: plan.longestStreak,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      },
      dailyProgress: progress.percentage,
      completedToday: progress.completed,
      totalToday: progress.total,
      badges,
    });
  } catch (error: any) {
    console.error("Recovery PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

