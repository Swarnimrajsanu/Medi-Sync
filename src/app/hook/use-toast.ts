import { toast as sonnerToast } from "sonner"

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title?: string
    description?: string
    variant?: "default" | "success" | "error" | "warning" | "info"
  }) => {
    const message = description || title || ""

    switch (variant) {
      case "success":
        return sonnerToast.success(title, { description })
      case "error":
        return sonnerToast.error(title, { description })
      case "warning":
        return sonnerToast.warning(title, { description })
      case "info":
        return sonnerToast.info(title, { description })
      default:
        return sonnerToast(title, { description })
    }
  }

  return {
    toast,
    success: (title: string, description?: string) =>
      toast({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      toast({ title, description, variant: "error" }),
    warning: (title: string, description?: string) =>
      toast({ title, description, variant: "warning" }),
    info: (title: string, description?: string) =>
      toast({ title, description, variant: "info" }),
  }
}

export { sonnerToast as toast }
