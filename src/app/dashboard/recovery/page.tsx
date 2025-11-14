"use client";

import { useToast } from "@/app/hook/use-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Progress from "@/components/ui/Progress";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useRecovery } from "@/hooks/useRecovery";
import { RecoveryTask } from "@/types/recovery";
import { motion } from "framer-motion";
import { Award, Ban, Calendar, CheckCircle2, Dumbbell, Flame, Pill, Stethoscope, TrendingUp } from "lucide-react";

const taskTypeIcons = {
  medicine: Pill,
  exercise: Dumbbell,
  followup: Stethoscope,
  restriction: Ban,
};

const taskTypeColors = {
  medicine: "bg-blue-50 text-blue-700 border-blue-200",
  exercise: "bg-green-50 text-green-700 border-green-200",
  followup: "bg-purple-50 text-purple-700 border-purple-200",
  restriction: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function RecoveryPage() {
  const { user, loading: authLoading } = useAuth();
  const { plan, loading, error, updating, updateTask, markAllCompleted } = useRecovery();
  const { toast } = useToast();

  const handleTaskToggle = async (task: RecoveryTask) => {
    const success = await updateTask({
      taskId: task.id,
      completed: !task.completed,
    });

    if (success) {
      toast({
        title: task.completed ? "Task Unmarked" : "Task Completed",
        description: `${task.title} ${task.completed ? "unmarked" : "marked as completed"}`,
        variant: "success",
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "error",
      });
    }
  };

  const handleMarkAllCompleted = async () => {
    if (!plan?.plan?.tasks?.length) return;

    const success = await markAllCompleted();
    if (success) {
      toast({
        title: "All Tasks Completed",
        description: "Great job! All tasks for today are completed.",
        variant: "success",
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to mark all tasks. Please try again.",
        variant: "error",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-24 w-full" />
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Card>
                <Skeleton className="h-32 w-full" />
              </Card>
              <Card>
                <Skeleton className="h-24 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!plan || !plan.plan) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Recovery Tracker</h1>
            <p className="text-slate-600">Track your recovery progress and complete daily tasks</p>
          </motion.div>

          <Card>
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Recovery Plan</h3>
              <p className="text-slate-600 mb-6">
                You don't have a recovery plan yet. Please contact your doctor to set up your recovery plan.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const tasks = plan.plan?.tasks || [];
  const groupedTasks = tasks.reduce((acc: Record<string, RecoveryTask[]>, task) => {
    if (!acc[task.type]) {
      acc[task.type] = [];
    }
    acc[task.type].push(task);
    return acc;
  }, {});

  const allCompleted = tasks.length > 0 && tasks.every((task) => task.completed);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Recovery Tracker</h1>
          <p className="text-slate-600">Track your recovery progress and complete daily tasks</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Today's Progress</h2>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {plan.plan?.currentStreak || 0} day streak
                  </span>
                </div>
              </div>
              <Progress
                value={plan.dailyProgress}
                label="Daily Progress"
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  {plan.completedToday} of {plan.totalToday} tasks completed
                </span>
                {allCompleted && (
                  <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    All done!
                  </span>
                )}
              </div>
            </Card>

            {/* Tasks by Type */}
            {Object.entries(groupedTasks).map(([type, typeTasks]) => {
              const Icon = taskTypeIcons[type as keyof typeof taskTypeIcons];
              const colorClass = taskTypeColors[type as keyof typeof taskTypeColors];
              
              return (
                <Card key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 capitalize">
                      {type === "followup" ? "Follow-up Visits" : type}
                    </h3>
                    <span className="ml-auto text-sm text-slate-500">
                      {typeTasks.filter((t) => t.completed).length} / {typeTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {typeTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onChange={() => handleTaskToggle(task)}
                          disabled={updating}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-medium ${
                                task.completed ? "text-slate-500 line-through" : "text-slate-900"
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                          )}
                          {task.scheduledTime && (
                            <p className="text-xs text-slate-500 mt-1">
                              Scheduled: {task.scheduledTime}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Mark All Button */}
            {tasks.length > 0 && !allCompleted && (
              <Button
                variant="primary"
                onClick={handleMarkAllCompleted}
                isLoading={updating}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Completed
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Current Streak</span>
                  <span className="text-lg font-bold text-teal-600 flex items-center">
                    <Flame className="h-4 w-4 mr-1" />
                    {plan.plan?.currentStreak || 0} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Longest Streak</span>
                  <span className="text-lg font-bold text-slate-900">
                    {plan.plan?.longestStreak || 0} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Tasks</span>
                  <span className="text-lg font-bold text-slate-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Completed Today</span>
                  <span className="text-lg font-bold text-green-600">
                    {plan.completedToday} / {plan.totalToday}
                  </span>
                </div>
              </div>
            </Card>

            {/* Badges Card */}
            {plan.badges.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-slate-900">Achievements</h3>
                </div>
                <div className="space-y-2">
                  {plan.badges.map((badge, index) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <Award className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">{badge}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Progress Chart Card */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Today</span>
                    <span>{Math.round(plan.dailyProgress)}%</span>
                  </div>
                  <Progress value={plan.dailyProgress} max={100} showLabel={false} />
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Started: {plan.plan?.startDate ? new Date(plan.plan.startDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

