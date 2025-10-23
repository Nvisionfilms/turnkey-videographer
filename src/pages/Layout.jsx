
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video, Settings, Calculator, Lock } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnlockStatus } from "@/components/hooks/useUnlockStatus";

const navigationItems = [
  {
    title: "Calculator",
    url: createPageUrl("Calculator"),
    icon: Calculator,
  },
  {
    title: "Setup Rates",
    url: createPageUrl("Admin"),
    icon: Settings,
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isUnlocked, hasUsedFreeQuote } = useUnlockStatus();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --color-bg-primary: #0a0a0a;
          --color-bg-secondary: #1a1a1a;
          --color-bg-tertiary: #252525;
          --color-bg-card: #1e1e1e;
          --color-accent-primary: #d4af37;
          --color-accent-secondary: #f4d03f;
          --color-accent-hover: #c19b2e;
          --color-text-primary: #ffffff;
          --color-text-secondary: #e5e5e5;
          --color-text-muted: #9ca3af;
          --color-border: #2a2a2a;
          --color-border-light: #3a3a3a;
          --color-success: #10b981;
          --color-warning: #f59e0b;
          --color-error: #ef4444;
          --color-input-bg: #1a1a1a;
          --color-input-border: #2a2a2a;
          --color-button-text: #0a0a0a;
        }
        
        body {
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
        }
        
        .nav-item-inactive {
          color: #9ca3af !important;
        }
        
        .nav-item-inactive:hover {
          color: #e5e5e5 !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        [data-radix-popper-content-wrapper] {
          background: var(--color-bg-secondary) !important;
        }
      `}</style>
      <div className="min-h-screen flex w-full" style={{ background: 'var(--color-bg-primary)' }}>
        <Sidebar className="border-r" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}>
          <SidebarHeader className="border-b p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}>
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f9b5f3cfe46753e8280ef4/7690db0e4_visioncapitalisthead.png"
                alt="Vision Capitalist Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h2 className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>Vision Capitalist</h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Videographer Calculator</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3" style={{ background: 'var(--color-bg-primary)' }}>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`rounded-lg mb-1 transition-all duration-200 ${
                          location.pathname === item.url 
                            ? 'font-medium' 
                            : 'nav-item-inactive'
                        }`}
                        style={location.pathname === item.url ? {
                          background: 'var(--color-accent-primary)',
                          color: 'var(--color-button-text)'
                        } : undefined}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}>
            <Alert className="border" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
              <AlertDescription className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Privacy First:</strong> All data is stored locally in your browser. Your quotes and settings are automatically saved and will persist even after closing the browser.
              </AlertDescription>
            </Alert>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
          <header className="border-b px-6 py-4 md:hidden" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2 rounded-lg transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }} />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f9b5f3cfe46753e8280ef4/7690db0e4_visioncapitalisthead.png"
                alt="Vision Capitalist"
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Vision Capitalist</h1>
              {!isUnlocked && hasUsedFreeQuote && (
                <Button
                  onClick={() => navigate(createPageUrl("Unlock"))}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-accent-primary)', color: 'var(--color-button-text)', borderColor: 'var(--color-accent-primary)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock or Try Trial
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto" style={{ background: 'var(--color-bg-primary)' }}>
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
    </SidebarProvider>
  );
}
