import { Stack } from "@/types/project"
import {
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiSvelte,
  SiNodedotjs,
  SiNextdotjs,
  SiExpress,
  SiNestjs,
  SiLaravel,
  SiPhp,
  SiDjango,
  SiFlask,
  SiRubyonrails,
  SiGo,
  SiRust,
} from "react-icons/si"
import { Code2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface StackIconProps {
  stack: Stack
  className?: string
}

const iconMap: Record<Stack, React.ComponentType<{ className?: string }>> = {
  react: SiReact,
  next: SiNextdotjs,
  vue: SiVuedotjs,
  angular: SiAngular,
  svelte: SiSvelte,
  node: SiNodedotjs,
  express: SiExpress,
  nestjs: SiNestjs,
  laravel: SiLaravel,
  php: SiPhp,
  django: SiDjango,
  flask: SiFlask,
  rails: SiRubyonrails,
  go: SiGo,
  rust: SiRust,
  other: Code2,
}

const colorMap: Record<Stack, string> = {
  react: "text-[#61DAFB]",
  next: "text-white",
  vue: "text-[#4FC08D]",
  angular: "text-[#DD0031]",
  svelte: "text-[#FF3E00]",
  node: "text-[#339933]",
  express: "text-[#ffffff]",
  nestjs: "text-[#E0234E]",
  laravel: "text-[#FF2D20]",
  php: "text-[#777BB4]",
  django: "text-[#092E20]",
  flask: "text-[#ffffff]",
  rails: "text-[#CC0000]",
  go: "text-[#00ADD8]",
  rust: "text-[#DEA584]",
  other: "text-zinc-400",
}

export function StackIcon({ stack, className }: StackIconProps) {
  const Icon = iconMap[stack]

  return <Icon className={cn("size-5", colorMap[stack], className)} />
}
