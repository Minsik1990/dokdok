"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CommentItem {
  id: string;
  author: string;
  content: string;
  created_at: string | null;
  type: "session" | "wishlist";
  targetId: string;
  targetTitle: string | null;
}

interface CommentFeedSectionProps {
  comments: CommentItem[];
  clubId: string;
}

const INITIAL_COUNT = 2;
const LOAD_MORE_COUNT = 5;

export function CommentFeedSection({ comments, clubId }: CommentFeedSectionProps) {
  const [showCount, setShowCount] = useState(INITIAL_COUNT);

  const visible = comments.slice(0, showCount);
  const remaining = comments.length - showCount;
  const hasMore = remaining > 0;

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
                  href={
                    c.type === "session"
                      ? `/club/${clubId}/session/${c.targetId}`
                      : `/club/${clubId}/wishlist/${c.targetId}`
                  }
                  className="text-primary font-medium hover:underline"
                >
                  {c.targetTitle ?? "모임 기록"}
                </Link>
                <span className="text-muted-foreground">에 댓글을 남겼습니다</span>
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-sm">{c.content}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{timeAgo(c.created_at)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowCount((prev) => prev + LOAD_MORE_COUNT)}
              className="text-primary hover:bg-muted w-full rounded-[14px] py-2 text-sm font-medium transition-colors"
            >
              더보기 ({remaining}개)
            </button>
          )}
          {showCount > INITIAL_COUNT && (
            <button
              type="button"
              onClick={() => setShowCount(INITIAL_COUNT)}
              className="text-muted-foreground hover:bg-muted w-full rounded-[14px] py-2 text-sm font-medium transition-colors"
            >
              접기
            </button>
          )}
        </div>
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
