import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <XCircleIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "!text-foreground/80",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-success/60 !bg-success/30 group-[.toaster]:!text-success dark:!bg-success/40",
          error:
            "!border-destructive/60 !bg-destructive/30 group-[.toaster]:!text-destructive dark:!bg-destructive/40",
          warning:
            "!border-warning/60 !bg-warning/30 group-[.toaster]:!text-warning dark:!bg-warning/40",
          info: "!border-info/60 !bg-info/30 group-[.toaster]:!text-info dark:!bg-info/40",
        },
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
