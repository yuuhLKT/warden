import { useEffect } from "react"
import { Providers } from "@/app/providers"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Dashboard } from "@/components/dashboard/dashboard"
import { MonitorPage } from "@/pages/monitor"
import { SettingsPage } from "@/pages/settings"
import { useUIStore } from "@/stores/ui-store"
import { useProjectStore } from "@/stores/project-store"

function AppContent() {
  const { currentPage } = useUIStore()
  const { loadProjects, scanWorkspace } = useProjectStore()

  useEffect(() => {
    loadProjects()
    scanWorkspace()
  }, [loadProjects, scanWorkspace])

  return (
    <div className="bg-background flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 flex-col overflow-hidden">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "monitor" && <MonitorPage />}
          {currentPage === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}

export default App
