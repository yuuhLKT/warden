import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/types/project"

interface StatusIndicatorProps {
  status: ProjectStatus
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

const sizeClasses = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
}

const statusColors: Record<ProjectStatus, string> = {
  running: "bg-green-500",
  stopped: "bg-zinc-400",
  error: "bg-red-500",
}

export function StatusIndicator({
  status,
  size = "md",
  pulse = true,
  className,
}: StatusIndicatorProps) {
  const showPulse = pulse && status === "running"

  return (
    <span className={cn("relative flex", sizeClasses[size], className)}>
      {showPulse && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            status === "running" ? "bg-green-400" : statusColors[status]
          )}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", sizeClasses[size], statusColors[status])}
      />
    </span>
  )
}
