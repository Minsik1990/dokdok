import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface SessionWithBook {
  id: string;
  session_number: number | null;
  session_date: string;
  presenter: string[] | null;
  participants: string[];
  books: {
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data: sessions } = await supabase
    .from("club_sessions")
    .select(
      "id, session_number, session_date, presenter, participants, books(title, author, cover_image_url)"
    )
    .eq("club_id", clubId)
    .order("session_date", { ascending: false });

  const typedSessions = (sessions ?? []) as unknown as SessionWithBook[];

  if (typedSessions.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="아직 기록이 없어요"
        description="첫 모임 기록을 남겨보세요"
      />
    );
  }

  return (
    <div className="space-y-3">
      {typedSessions.map((session) => (
        <Link
          key={session.id}
          href={`/club/${clubId}/session/${session.id}`}
          className="bg-card hover:bg-muted flex gap-4 rounded-[20px] p-4 shadow-sm transition-colors"
        >
          {/* 책 표지 */}
          <div className="bg-muted relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg">
            {session.books?.cover_image_url ? (
              <Image
                src={session.books.cover_image_url}
                alt={session.books.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="text-muted-foreground h-5 w-5" />
              </div>
            )}
          </div>

          {/* 세션 정보 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold">
                {session.books?.title ?? `제${session.session_number}회 모임`}
              </h3>
              <span className="bg-secondary text-secondary-foreground flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
                #{session.session_number}
              </span>
            </div>
            {session.books?.author && (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {session.books.author}
              </p>
            )}
            <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(session.session_date)}
              </span>
              {session.presenter && session.presenter.length > 0 && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {session.presenter.join(", ")}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
