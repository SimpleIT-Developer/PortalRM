import { useState } from "react";
import { useLocation, Switch, Route } from "wouter";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileMenuButton } from "@/components/navigation/mobile-menu-button";
import { TokenIndicator } from "@/components/ui/token-indicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { ColigadaSelector } from "@/components/coligada-selector";
import { menuItems } from "@/config/menu-items";
import TokenInfoPage from "./token-info";

export default function DashboardPage() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        items={menuItems}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
              Portal RM - Skeleton
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <ColigadaSelector />
             <TokenIndicator />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Switch>
             <Route path="/dashboard">
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Skeleton</h2>
                    <p className="text-gray-600">Este é um projeto base limpo com autenticação e multi-tenancy configurados.</p>
                </div>
             </Route>
             <Route path="/dashboard/token-info" component={TokenInfoPage} />
          </Switch>
        </main>
      </div>
    </div>
  );
}
