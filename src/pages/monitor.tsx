import { useTranslation } from "@/i18n"
import { EmptyState } from "@/components/common/empty-state"
import { Activity } from "lucide-react"

export function MonitorPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={<Activity className="text-muted-foreground size-8" />}
        title={t("nav.monitor")}
        description={t("monitor.comingSoonDescription")}
      />
    </div>
  )
}
