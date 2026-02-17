import { useTranslation } from "@/i18n"
import { useUIStore } from "@/stores/ui-store"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SidebarContent } from "./sidebar-content"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function MobileNav() {
  const { t } = useTranslation()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>{t("nav.menuTitle")}</SheetTitle>
          </VisuallyHidden>
        </SheetHeader>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
