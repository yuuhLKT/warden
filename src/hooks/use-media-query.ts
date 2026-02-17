import { useState, useEffect } from "react"

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl"

const breakpoints: Record<Breakpoint, string> = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(breakpoints[breakpoint])
}

export function useIsMobile(): boolean {
  return !useMediaQuery(breakpoints.md)
}

export function useIsTablet(): boolean {
  const isMd = useMediaQuery(breakpoints.md)
  const isLg = useMediaQuery(breakpoints.lg)
  return isMd && !isLg
}

export function useIsDesktop(): boolean {
  return useMediaQuery(breakpoints.lg)
}
