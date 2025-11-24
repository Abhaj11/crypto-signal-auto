"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { GiantOracleLogo } from "@/components/icons/giant-oracle-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LayoutDashboard, PanelLeft, TrendingUp, DollarSign, LogOut, User, Search, Gauge, Wallet } from "lucide-react";
import React from "react";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: "/market-scanner", label: "Signal Screener", icon: Search, tooltip: "Signal Screener" },
  { href: "/trading", label: "Trading", icon: Gauge, tooltip: "Trading" },
  { href: "/wallet", label: "Wallet", icon: Wallet, tooltip: "Wallet" },
  { href: "/market-opportunity", label: "Market Opportunity", icon: TrendingUp, tooltip: "Market Opportunity" },
  { href: "/pricing", label: "Pricing", icon: DollarSign, tooltip: "Pricing" },
];


function UserNav() {
  const { user, signOut } = useAuth();
  
  if (!user) {
    return (
       <Button asChild variant="outline" size="sm">
         <Link href="/auth">Sign In</Link>
       </Button>
    )
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="@shadcn" />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Pro Trader</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PublicHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container mx-auto flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <GiantOracleLogo className="h-6 w-6 text-primary" />
              <span className="font-bold">GiantOracle</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
                <Link href="/market-opportunity" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Market Opportunity
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Pricing
                </Link>
                 <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Dashboard
                </Link>
            </nav>
            <UserNav />
          </div>
        </header>
    );
}


function PrivateLayout({ children }: { children: React.ReactNode }) {
     const pathname = usePathname();
     return (
        <SidebarProvider>
            <Sidebar
                side="left"
                variant="sidebar"
                collapsible="icon"
                className="border-sidebar-border"
            >
                <SidebarHeader className="h-14 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:justify-center">
                <Link href="/" className="flex items-center gap-2">
                <GiantOracleLogo className="size-7 text-sidebar-foreground" />
                <span className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    GiantOracle
                </span>
                </Link>
                </SidebarHeader>
                <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={pathname.startsWith(item.href)}
                            tooltip={{
                            children: item.tooltip,
                            }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                <div className="flex w-full items-center gap-3 overflow-hidden p-2">
                    <UserNav />
                </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger className="md:hidden">
                    <PanelLeft />
                </SidebarTrigger>
                <div className="relative ml-auto flex-1 md:grow-0">
                    {/* Can add search bar here later */}
                </div>
                <div className="hidden md:block">
                    <UserNav />
                </div>
                </header>
                <main className="flex-1">
                 {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
     )
}


export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  const isPrivatePage = ['/dashboard', '/account', '/market-scanner', '/trading', '/wallet'].some(path => pathname.startsWith(path));
  
  if (isPrivatePage) {
      return <PrivateLayout>{children}</PrivateLayout>;
  }

  return (
    <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
    </div>
  );
}
