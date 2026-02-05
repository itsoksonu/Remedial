"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Icons.dashboard,
  },
  {
    title: "Claims",
    href: "/dashboard/claims",
    icon: Icons.claims,
  },
  {
    title: "Appeals",
    href: "/dashboard/appeals",
    icon: Icons.appeals,
  },
  {
    title: "Denials",
    href: "/dashboard/denials",
    icon: Icons.denials,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Icons.notifications,
  },
  {
    title: "Files",
    href: "/dashboard/files",
    icon: Icons.files,
  },
  {
    title: "Organizations",
    href: "/dashboard/organizations",
    icon: Icons.organizations,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Icons.users,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Icons.settings,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-card transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight truncate">
              Remedial
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <Icons.chevronRight className="h-4 w-4" />
            ) : (
              <Icons.chevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
            {sidebarNavItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "transparent",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center px-2",
            )}
          >
            <Icons.logout className="h-4 w-4 mr-2" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs or Title could go here */}
            <h2 className="text-lg font-semibold">
              {sidebarNavItems.find((i) => i.href === pathname)?.title ||
                "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Icons.sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Icons.moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Icons.notifications className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Icons.user className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
