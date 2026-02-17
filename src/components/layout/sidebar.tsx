import { useIsDesktop } from "@/hooks/use-media-query"
import { useUIStore } from "@/stores/ui-store"
import { SidebarContent } from "./sidebar-content"
import { MobileNav } from "./mobile-nav"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const isDesktop = useIsDesktop()
  const { sidebarCollapsed } = useUIStore()

  if (!isDesktop) {
    return <MobileNav />
  }

  return (
    <aside
      className={cn(
        "bg-card hidden h-screen flex-col border-r transition-all duration-300 ease-in-out lg:flex",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent collapsed={sidebarCollapsed} />
    </aside>
  )
}
