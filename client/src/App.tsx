import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "./lib/tenant-context";
import LoginPage from "@/pages/login";
import AdminLoginPage from "@/pages/admin-login";
import RegisterPage from "@/pages/register";
import LandingPage from "@/pages/landing-page";
import DashboardPage from "@/pages/dashboard";
import TenantSettingsPage from "@/pages/tenant-settings";
import CompanyNotFoundPage from "@/pages/company-not-found";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/*" component={DashboardPage} />
      <Route path="/tenant-settings" component={TenantSettingsPage} />
      <Route path="/company-not-found" component={CompanyNotFoundPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}

export default App;
