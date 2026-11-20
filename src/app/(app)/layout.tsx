"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import {
  Apple,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Dumbbell,
  FileText,
  Flame,
  HeartPulse,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Ruler,
  Scale,
  Settings,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { post } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickLogModal } from "@/components/quick-log-modal";
import { hapticTap } from "@/lib/haptic";

/*
 * App shell — wraps every authenticated route under the (app) route group.
 * Sidebar state is owned by SidebarProvider (cookie-backed) and shared with
 * the SidebarRail + SidebarTrigger so collapse/expand + ⌘B/Ctrl+B all work.
 * Sign-out posts to /api/auth/signout.
 *
 * Nav list mirrors the original Lovable sidebar order. "Today" and "Weight"
 * both route to /checkin for now — once the checkin page has a weight
 * anchor, route Weight to /checkin#weight.
 */

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { href: "/checkin", label: "Today", icon: <CalendarDays className="size-4" /> },
  { href: "/habits", label: "Habits", icon: <Flame className="size-4" /> },
  { href: "/weight", label: "Weight", icon: <Scale className="size-4" /> },
  { href: "/measurements", label: "Measurement", icon: <Ruler className="size-4" /> },
  { href: "/nutrition", label: "Nutrition", icon: <Apple className="size-4" /> },
  { href: "/workouts", label: "Workouts", icon: <Dumbbell className="size-4" /> },
  { href: "/cardio", label: "Cardio", icon: <HeartPulse className="size-4" /> },
  { href: "/fasting", label: "Fasting", icon: <Timer className="size-4" /> },
  { href: "/calendar", label: "Calendar", icon: <Calendar className="size-4" /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
  { href: "/photos", label: "Photos", icon: <ImageIcon className="size-4" /> },
  { href: "/journal", label: "Journal", icon: <PenLine className="size-4" /> },
  { href: "/challenges", label: "Challenges", icon: <Target className="size-4" /> },
  { href: "/achievements", label: "Achievements", icon: <Trophy className="size-4" /> },
  { href: "/reports", label: "Reports", icon: <FileText className="size-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut(): Promise<void> {
    try {
      await post("/api/auth/signout", {});
    } catch {
      // even if the server call fails, drop the local session view.
    }
    toast.success("Signed out");
    router.replace("/auth");
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2.5 px-2 py-2 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ik.imagekit.io/petdz32jy/forge-progress/image_2026-08-27_150101975.png"
              alt="Forge"
              className="size-10 shrink-0 rounded-xl object-contain group-data-[collapsible=icon]:size-10"
            />
            <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-base font-semibold tracking-tight">Forge</span>
              <span className="truncate text-[11px] text-sidebar-foreground/70">
                built for one disciplined human
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const itemPath = item.href.split("#")[0]!;
                  const active =
                    pathname === itemPath ||
                    (itemPath !== "/" && pathname?.startsWith(`${itemPath}/`));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        size="lg"
                      >
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator className="mb-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} tooltip="Sign out" size="lg">
                <LogOut className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <CollapseButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ik.imagekit.io/petdz32jy/forge-progress/image_2026-08-27_150101975.png"
              alt="Forge"
              className="size-8 rounded-lg object-contain"
            />
            <span className="text-sm font-semibold tracking-tight">Forge</span>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
          <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
        </main>
        <QuickLogModal />
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/checkin", label: "Today", icon: CalendarDays },
    { href: "/habits", label: "Habits", icon: Flame },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => hapticTap(10)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${
              active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`size-5 ${active ? "text-primary" : ""}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          hapticTap(10);
          toggleSidebar();
        }}
        className="flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-5" />
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  );
}

/*
 * Collapse / expand toggle — visible pill button that lives at the very
 * bottom of the sidebar (after Sign out), matching the original Lovable
 * layout. Reads state from useSidebar so it stays in sync with the rail,
 * the ⌘B shortcut, and any external trigger.
 */
function CollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarMenuButton onClick={toggleSidebar} size="lg">
      {collapsed ? (
        <ChevronsRight className="size-4" />
      ) : (
        <ChevronsLeft className="size-4" />
      )}
      <span>{collapsed ? "Expand" : "Collapse"}</span>
    </SidebarMenuButton>
  );
}
