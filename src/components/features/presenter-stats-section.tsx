"use client";

import { useMemo } from "react";
import { Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PersonTimelineDialog,
  type SessionInfo,
} from "@/components/features/person-timeline-dialog";

interface PresenterStatsSectionProps {
  presenterStats: { name: string; count: number }[];
  sessions: {
    id: string;
    session_date: string;
    presenter: string[] | null;
    book?: {
      title: string;
      author: string | null;
      cover_image_url: string | null;
    } | null;
  }[];
  clubId: string;
}

export function PresenterStatsSection({
  presenterStats,
  sessions,
  clubId,
}: PresenterStatsSectionProps) {
  // 발제자별 세션 목록 사전 계산
  const sessionsByPresenter = useMemo(() => {
    const map = new Map<string, SessionInfo[]>();
    for (const s of sessions) {
      for (const p of s.presenter ?? []) {
        if (!map.has(p)) map.set(p, []);
        map.get(p)!.push({ id: s.id, session_date: s.session_date, book: s.book });
      }
    }
    return map;
  }, [sessions]);

  const maxCount = presenterStats[0]?.count ?? 1;

  return (
    <Card className="rounded-[20px]">
      <CardContent>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Mic className="text-primary h-4 w-4" />
          발제 횟수
        </h3>
        <div className="space-y-2.5">
          {presenterStats.map((m) => (
            <PersonTimelineDialog
              key={m.name}
              name={m.name}
              role="presenter"
              sessions={sessionsByPresenter.get(m.name) ?? []}
              clubId={clubId}
              trigger={
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="w-16 shrink-0 truncate text-left text-sm font-medium">
                    {m.name}
                  </span>
                  <div className="bg-muted h-7 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary flex h-full items-center rounded-full px-2.5 transition-all"
                      style={{
                        width: `${Math.max((m.count / maxCount) * 100, 15)}%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">{m.count}회</span>
                    </div>
                  </div>
                </button>
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
