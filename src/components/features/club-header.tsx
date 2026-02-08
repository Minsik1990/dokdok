"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubHeaderProps {
  clubId: string;
  clubName: string;
}

const tabs = [
  { label: "책장", href: "" },
  { label: "타임라인", href: "/timeline" },
  { label: "읽고 싶은 책", href: "/wishlist" },
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
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link href={basePath}>
            <Image
              src="/logo-header.png"
              alt="독독"
              width={60}
              height={20}
              className="h-5 w-auto shrink-0"
            />
          </Link>
          <div className="bg-border h-4 w-px shrink-0" />
          <h1 className="text-foreground truncate text-base font-semibold">{clubName}</h1>
        </div>
        <Link
          href={`${basePath}/settings`}
          aria-label="모임 설정"
          className="text-muted-foreground hover:bg-muted ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
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
            aria-current={isActive(tab.href) ? "page" : undefined}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors",
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
