"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

// FAB를 숨길 하위 경로 패턴
const HIDDEN_SUFFIXES = ["/session/new", "/edit", "/settings"];

interface FabButtonProps {
  href: string;
}

export function FabButton({ href }: FabButtonProps) {
  const pathname = usePathname();

  if (HIDDEN_SUFFIXES.some((s) => pathname.endsWith(s))) {
    return null;
  }

  return (
    <Link
      href={href}
      className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-20 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
