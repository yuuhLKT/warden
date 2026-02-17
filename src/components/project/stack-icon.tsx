import { Stack } from "@/types/project"
import {
  Atom,
  FileCode,
  Code,
  Hexagon,
  FileQuestion,
  Triangle,
  Component,
  Server,
  Gem,
  Cog,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StackIconProps {
  stack: Stack
  className?: string
}

const iconMap: Record<Stack, React.ComponentType<{ className?: string }>> = {
  react: Atom,
  next: Triangle,
  vue: Component,
  angular: Code,
  svelte: Code,
  node: Hexagon,
  express: Server,
  nestjs: Server,
  laravel: FileCode,
  php: Code,
  django: Code,
  flask: Code,
  rails: Gem,
  go: Cog,
  rust: Cog,
  other: FileQuestion,
}

const colorMap: Record<Stack, string> = {
  react: "text-cyan-500",
  next: "text-zinc-100",
  vue: "text-emerald-500",
  angular: "text-red-500",
  svelte: "text-orange-500",
  node: "text-green-500",
  express: "text-zinc-400",
  nestjs: "text-red-500",
  laravel: "text-red-500",
  php: "text-indigo-500",
  django: "text-green-600",
  flask: "text-zinc-400",
  rails: "text-red-600",
  go: "text-cyan-400",
  rust: "text-orange-600",
  other: "text-zinc-400",
}

export function StackIcon({ stack, className }: StackIconProps) {
  const Icon = iconMap[stack]

  return <Icon className={cn("size-5", colorMap[stack], className)} />
}
