"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PersonTimelineDialog,
  type SessionInfo,
} from "@/components/features/person-timeline-dialog";

interface MemberBooksSectionProps {
  memberStats: { name: string; count: number }[];
  sessions: {
    id: string;
    session_date: string;
    participants: string[] | null;
    book?: {
      title: string;
      author: string | null;
      cover_image_url: string | null;
    } | null;
  }[];
  clubId: string;
}

export function MemberBooksSection({ memberStats, sessions, clubId }: MemberBooksSectionProps) {
  // 참여자별 세션 목록 사전 계산
  const sessionsByParticipant = useMemo(() => {
    const map = new Map<string, SessionInfo[]>();
    for (const s of sessions) {
      for (const p of s.participants ?? []) {
        if (!map.has(p)) map.set(p, []);
        map.get(p)!.push({ id: s.id, session_date: s.session_date, book: s.book });
      }
    }
    return map;
  }, [sessions]);

  return (
    <Card className="rounded-[20px]">
      <CardContent>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="text-primary h-4 w-4" />
          우리가 함께 읽은 책
        </h3>
        <div className="flex flex-wrap gap-2">
          {memberStats.map((m) => (
            <PersonTimelineDialog
              key={m.name}
              name={m.name}
              role="participant"
              sessions={sessionsByParticipant.get(m.name) ?? []}
              clubId={clubId}
              trigger={
                <button
                  type="button"
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <Badge variant="secondary" className="gap-1.5 rounded-full py-1.5 pr-2.5 pl-3">
                    {m.name}
                    <span className="bg-primary/10 text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold">
                      {m.count}권
                    </span>
                  </Badge>
                </button>
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
