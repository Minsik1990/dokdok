"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
  { href: "/record/new", icon: PlusCircle, label: "기록" },
  { href: "/groups", icon: Users, label: "모임" },
  { href: "/profile", icon: User, label: "프로필" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border/50 bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", href === "/record/new" && "text-primary h-6 w-6")} />
              <span>{label}</span>
              {isActive && (
                <span className="bg-primary absolute -bottom-0.5 h-1 w-1 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
