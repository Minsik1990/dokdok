"use client";

import { Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PersonTimelineDialog,
  type SessionInfo,
} from "@/components/features/person-timeline-dialog";

interface TagStatsSectionProps {
  tagStats: { tag: string; count: number }[];
  tagSessions: Record<string, SessionInfo[]>;
  clubId: string;
}

export function TagStatsSection({ tagStats, tagSessions, clubId }: TagStatsSectionProps) {
  return (
    <Card className="rounded-[20px]">
      <CardContent>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Tag className="text-primary h-4 w-4" />
          태그
        </h3>
        <div className="flex flex-wrap gap-2">
          {tagStats.map((t) => (
            <PersonTimelineDialog
              key={t.tag}
              name={t.tag}
              role="participant"
              sessions={tagSessions[t.tag] ?? []}
              clubId={clubId}
              customTitle={`${t.tag} (${t.count}회)`}
              trigger={
                <button
                  type="button"
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <Badge variant="secondary" className="gap-1.5 rounded-full py-1.5 pr-2.5 pl-3">
                    {t.tag}
                    <span className="bg-primary/10 text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold">
                      {t.count}회
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
