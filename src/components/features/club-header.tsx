"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubHeaderProps {
  clubId: string;
  clubName: string;
}

const tabs = [
  { label: "갤러리", href: "" },
  { label: "타임라인", href: "/timeline" },
  { label: "프로필", href: "/profile" },
];

export function ClubHeader({ clubId, clubName }: ClubHeaderProps) {
  const pathname = usePathname();
  const basePath = `/club/${clubId}`;

  function isActive(tabHref: string) {
    if (tabHref === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(basePath + tabHref);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-foreground text-lg font-bold">{clubName}</h1>
        <Link
          href={`${basePath}/settings`}
          className="text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* 탭 네비게이션 */}
      <nav className="border-border flex border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`${basePath}${tab.href}`}
            className={cn(
              "flex-1 py-2.5 text-center text-sm font-medium transition-colors",
              isActive(tab.href)
                ? "border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
