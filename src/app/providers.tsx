import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useSettingsStore } from "@/stores/settings-store"
import "@/i18n/config"

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = () => {
      if (theme === "system") {
        root.classList.toggle("dark", systemDark.matches)
      } else {
        root.classList.toggle("dark", theme === "dark")
      }
    }

    applyTheme()

    if (theme === "system") {
      systemDark.addEventListener("change", applyTheme)
      return () => systemDark.removeEventListener("change", applyTheme)
    }
  }, [theme])

  return <>{children}</>
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
