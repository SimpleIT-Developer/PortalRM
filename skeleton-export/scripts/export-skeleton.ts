import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const destDir = path.join(rootDir, 'skeleton-export');

const FILES_TO_KEEP_IN_PAGES = [
    'login.tsx',
    'register.tsx',
    'not-found.tsx',
    'dashboard.tsx', // Will be overwritten
    'admin-login.tsx',
    'superadmin-login.tsx',
    'superadmin-tenants.tsx',
    'tenant-settings.tsx',
    'token-info.tsx',
    'trial-expired.tsx',
    'company-not-found.tsx',
    'landing-page.tsx'
];

function cleanDir(dir: string) {
    if (fs.existsSync(dir)) {
        console.log(`Limpando diretório destino: ${dir}`);
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

function copyFiltered(src: string, dest: string) {
    const ignoreList = [
        'node_modules', '.git', 'dist', 'skeleton-export', 
        '.env', 'npm-debug.log', 'yarn-error.log'
    ];

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const items = fs.readdirSync(src);
    for (const item of items) {
        if (ignoreList.includes(item)) continue;
        
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stats = fs.statSync(srcPath);

        // Ignore simpledfe folders anywhere
        if (item === 'simpledfe') continue;

        if (stats.isDirectory()) {
            copyFiltered(srcPath, destPath);
        } else {
            // Ignore files with simpledfe in name
            if (item.includes('simpledfe')) continue;
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('🚀 Iniciando exportação do esqueleto...');
cleanDir(destDir);

console.log('📂 Copiando arquivos...');
copyFiltered(rootDir, destDir);

// Clean pages directory
console.log('🧹 Limpando páginas específicas de negócio...');
const pagesDir = path.join(destDir, 'client', 'src', 'pages');
if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir);
    for (const page of pages) {
        const pagePath = path.join(pagesDir, page);
        const stats = fs.statSync(pagePath);
        
        // Keep folders (like 'admin') if they are not business specific?
        // Actually, 'admin' has 'login-log.tsx' which is fine.
        // 'simpledfe' folder was already skipped by copyFiltered.
        
        if (stats.isDirectory()) {
             // Keep admin folder
             if (page === 'admin') continue;
             // Remove other folders if any
             fs.rmSync(pagePath, { recursive: true, force: true });
        } else {
            if (!FILES_TO_KEEP_IN_PAGES.includes(page)) {
                fs.unlinkSync(pagePath);
            }
        }
    }
}

// Overwrite client/src/config/menu-items.ts
console.log('📝 Reescrevendo menu-items.ts...');
const menuItemsContent = `import { Home, Settings, Shield } from "lucide-react";

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
`;
fs.writeFileSync(path.join(destDir, 'client/src/config/menu-items.ts'), menuItemsContent);

// Overwrite client/src/pages/dashboard.tsx
console.log('📝 Reescrevendo dashboard.tsx...');
const dashboardContent = `import { useState } from "react";
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
`;
fs.writeFileSync(path.join(destDir, 'client/src/pages/dashboard.tsx'), dashboardContent);

// Clean server/routes.ts
console.log('📝 Limpando server/routes.ts...');
const routesPath = path.join(destDir, 'server/routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf-8');

// Remove import
routesContent = routesContent.replace(/import { registerSimpleDFeRoutes } from ".\/simpledfe\/routes";\r?\n/, '');
// Remove call
routesContent = routesContent.replace(/await registerSimpleDFeRoutes\(app\);\r?\n/, '');

fs.writeFileSync(routesPath, routesContent);

// Clean Sentencas
console.log('📝 Resetando sentencas.txt...');
const sentencasContent = `001→SIT.PORTALRM.001`;
fs.writeFileSync(path.join(destDir, 'ambiente/sentencas.txt'), sentencasContent);

const conteudoSentencasContent = `001→SIT.PORTALRM.001 - Teste
002→    "select 1"`;
fs.writeFileSync(path.join(destDir, 'ambiente/conteudo_sentencas.txt'), conteudoSentencasContent);

// Create .env.example
console.log('📝 Criando .env.example...');
const envExample = `DATABASE_URL=postgres://...
SUPERADMIN_EMAIL=super@admin.com
SUPERADMIN_PASSWORD_HASH=...
SESSION_SECRET=secret
`;
fs.writeFileSync(path.join(destDir, '.env.example'), envExample);

console.log('✅ Exportação concluída com sucesso!');
console.log(`📁 Local: ${destDir}`);