import { Home, Settings, Shield } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  inDevelopment?: boolean;
}

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },
  {
    id: "admin",
    label: "Administração",
    icon: Shield,
    children: [
        {
            id: "tenant-settings",
            label: "Configurações",
            icon: Settings,
            path: "/tenant-settings"
        }
    ]
  }
];
