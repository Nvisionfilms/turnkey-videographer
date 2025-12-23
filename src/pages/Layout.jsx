import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video, Settings, Calculator, Lock, BarChart3, LogOut, LogIn, Users } from "lucide-react";
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
    title: "Crew Pricing",
    url: createPageUrl("Calculator"),
    icon: Calculator,
  },
  {
    title: "Deliverables Pricing",
    url: createPageUrl("DeliverableCalculator"),
    icon: Video,
  },
  {
    title: "Setup Rates",
    url: createPageUrl("Admin"),
    icon: Settings,
  },
  {
    title: "Affiliates",
    url: "/admin/dashboard",
    icon: Users,
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
          /* Dark Tool Theme - Minimal, Professional */
          --color-bg-primary: #0a0a0b;
          --color-bg-secondary: #111113;
          --color-bg-tertiary: #18181b;
          --color-bg-card: #111113;
          --color-accent-primary: #3b82f6;
          --color-accent-secondary: #60a5fa;
          --color-accent-hover: #2563eb;
          --color-text-primary: #fafafa;
          --color-text-secondary: #a1a1aa;
          --color-text-muted: #71717a;
          --color-border: #27272a;
          --color-border-light: #1f1f23;
          --color-border-dark: #3f3f46;
          --color-success: #22c55e;
          --color-warning: #eab308;
          --color-danger: #ef4444;
          --color-error: #ef4444;
          --color-input-bg: #18181b;
          --color-input-border: #27272a;
          --color-button-text: #fafafa;
        }

        body {
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
        }
        
        .nav-item-inactive {
          color: var(--color-text-muted) !important;
        }
        
        .nav-item-inactive:hover {
          color: var(--color-text-primary) !important;
          background: rgba(59, 130, 246, 0.1) !important;
        }

        [data-radix-popper-content-wrapper] {
          background: var(--color-bg-secondary) !important;
        }

        /* Minimal card styling */
        [class*="Card"] {
          border-radius: 8px !important;
          box-shadow: none !important;
          border: 1px solid var(--color-border) !important;
          padding: 16px !important;
          margin-bottom: 16px !important;
          background: var(--color-bg-card) !important;
        }

        /* Card headers - minimal */
        [class*="CardHeader"] {
          padding-bottom: 12px !important;
          margin-bottom: 12px !important;
          border-bottom: 1px solid var(--color-border) !important;
        }

        [class*="CardTitle"] {
          font-size: 14px !important;
          font-weight: 500 !important;
          color: var(--color-text-secondary) !important;
          letter-spacing: 0.02em !important;
          text-transform: uppercase !important;
        }

        /* Card content spacing */
        [class*="CardContent"] {
          padding: 0 !important;
        }

        /* Input styling - dark */
        input, select, textarea {
          border-radius: 6px !important;
          transition: all 0.15s ease !important;
          color: var(--color-text-primary) !important;
          background: var(--color-input-bg) !important;
          border: 1px solid var(--color-input-border) !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
        }

        input::placeholder, textarea::placeholder {
          color: var(--color-text-muted) !important;
        }

        input:focus, select:focus, textarea:focus {
          border-color: var(--color-accent-primary) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          outline: none !important;
        }

        /* Dropdown/Select styling */
        [role="option"]:hover,
        [data-state="checked"] {
          background: rgba(59, 130, 246, 0.15) !important;
        }

        [role="option"][data-highlighted] {
          background: rgba(59, 130, 246, 0.15) !important;
        }

        /* Button styling - minimal */
        button {
          border-radius: 6px !important;
          font-weight: 500 !important;
          transition: all 0.15s ease !important;
        }

        button:hover {
          transform: none;
          box-shadow: none !important;
        }

        /* Primary button */
        button[style*="background: var(--color-accent-primary)"],
        button[style*="background-color: var(--color-accent-primary)"] {
          background: var(--color-accent-primary) !important;
          color: var(--color-button-text) !important;
          border: none !important;
        }

        button[style*="background: var(--color-accent-primary)"]:hover,
        button[style*="background-color: var(--color-accent-primary)"]:hover {
          background: var(--color-accent-hover) !important;
        }

        /* Label styling - StudioBinder */
        label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: var(--color-text-secondary) !important;
          margin-bottom: 8px !important;
          display: block !important;
          letter-spacing: 0.01em !important;
        }

        /* Form groups spacing */
        .space-y-4 > * + * {
          margin-top: 20px !important;
        }

        .space-y-6 > * + * {
          margin-top: 32px !important;
        }

        /* Section headers */
        h2 {
          font-size: 24px !important;
          font-weight: 700 !important;
          color: var(--color-text-primary) !important;
          margin-bottom: 8px !important;
          letter-spacing: -0.02em !important;
        }

        h3 {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: var(--color-text-primary) !important;
          letter-spacing: -0.01em !important;
        }

        /* Typography improvements */
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600 !important;
          letter-spacing: -0.02em !important;
        }

        /* Table improvements */
        table {
          border-radius: 12px !important;
          overflow: hidden !important;
          border: 1px solid var(--color-border) !important;
        }

        th {
          background: var(--color-bg-tertiary) !important;
          color: var(--color-text-primary) !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 12px 16px !important;
        }

        td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--color-border-light) !important;
        }

        tr:last-child td {
          border-bottom: none !important;
        }

        /* Smooth scrolling */
        * {
          scroll-behavior: smooth;
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
                <h2 className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>TurnKey</h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pricing Infrastructure</p>
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
            {/* Sign In/Out Buttons */}
            <div className="space-y-2 mb-4">
              <Button
                onClick={() => navigate('/affiliate/login')}
                variant="outline"
                className="w-full justify-start"
                style={{ 
                  background: 'var(--color-bg-secondary)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminEmail');
                  window.location.href = '/';
                }}
                variant="outline"
                className="w-full justify-start"
                style={{ 
                  background: 'var(--color-bg-secondary)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <Alert className="border" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--color-accent-primary)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--color-accent-primary)' }} />
              <AlertDescription className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Privacy First:</strong> All data is stored locally in your browser.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-4 justify-center pt-2">
              <a 
                href="/#/Terms" 
                className="text-xs hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Terms
              </a>
              <a 
                href="/#/Privacy" 
                className="text-xs hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Privacy
              </a>
            </div>
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
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>TurnKey</h1>
              {!isUnlocked && hasUsedFreeQuote && (
                <Button
                  onClick={() => navigate(createPageUrl("Unlock"))}
                  variant="outline"
                  size="sm"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Enable recording
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
