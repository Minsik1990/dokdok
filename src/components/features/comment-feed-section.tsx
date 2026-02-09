"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CommentItem {
  id: string;
  author: string;
  content: string;
  created_at: string | null;
  sessionId: string;
  bookTitle: string | null;
}

interface CommentFeedSectionProps {
  comments: CommentItem[];
  clubId: string;
}

const INITIAL_COUNT = 10;

export function CommentFeedSection({ comments, clubId }: CommentFeedSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? comments : comments.slice(0, INITIAL_COUNT);
  const hasMore = comments.length > INITIAL_COUNT;

  return (
    <Card className="rounded-[20px]">
      <CardContent>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="text-primary h-4 w-4" />
          댓글 ({comments.length})
        </h3>
        <div className="space-y-1">
          {visible.map((c) => (
            <div key={c.id} className="rounded-[14px] p-3 transition-colors hover:bg-green-50/50">
              <p className="text-sm">
                <span className="font-semibold">{c.author}</span>
                <span className="text-muted-foreground">님이 </span>
                <Link
                  href={`/club/${clubId}/session/${c.sessionId}`}
                  className="text-primary font-medium hover:underline"
                >
                  {c.bookTitle ?? "모임 기록"}
                </Link>
                <span className="text-muted-foreground">에 댓글을 남겼습니다</span>
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-sm">{c.content}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{timeAgo(c.created_at)}</p>
            </div>
          ))}
        </div>
        {hasMore && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setShowAll(true)}
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            더보기 ({comments.length - INITIAL_COUNT}개)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
