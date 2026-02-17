import { useTranslation } from "@/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, description, icon, trend, className }: StatsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-[11px] font-medium sm:text-xs">
              {title}
            </p>
            <p className="text-base leading-tight font-bold sm:text-lg lg:text-xl">{value}</p>
            {description && (
              <p className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                {description}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-[10px] font-medium sm:text-[11px]",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {t("dashboard.stats.comparedToYesterday", { value: trend.value })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
