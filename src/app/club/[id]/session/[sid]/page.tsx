import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, Users, BookOpen, Pencil, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DeleteSessionButton } from "@/components/features/delete-session-button";
import { SessionComments } from "@/components/features/session-comments";
import { PhotoUploader } from "@/components/features/photo-uploader";

import type { Database } from "@/lib/supabase/database.types";

type ClubSession = Database["public"]["Tables"]["club_sessions"]["Row"];
type Book = Database["public"]["Tables"]["books"]["Row"];
type SessionWithBook = ClubSession & { books: Book | null };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id: clubId, sid } = await params;
  const supabase = createClient();

  const [sessionResult, allDatesResult] = await Promise.all([
    supabase
      .from("club_sessions")
      .select("*, books(*)")
      .eq("id", sid)
      .eq("club_id", clubId)
      .maybeSingle(),
    supabase
      .from("club_sessions")
      .select("session_date, is_counted")
      .eq("club_id", clubId)
      .order("session_date", { ascending: true }),
  ]);

  if (!sessionResult.data) notFound();

  const session = sessionResult.data as unknown as SessionWithBook;
  const book = session.books;

  // 날짜 기반 모임 회차 계산 (is_counted=false 세션 제외)
  const countedDateSessions = (allDatesResult.data ?? []).filter((s) => s.is_counted !== false);
  const uniqueDates = [...new Set(countedDateSessions.map((s) => s.session_date))].sort();
  const dateToMeetingNum = new Map<string, number>();
  uniqueDates.forEach((date, i) => dateToMeetingNum.set(date, i + 1));
  const meetingNumber = dateToMeetingNum.get(session.session_date) ?? 0;

  return (
    <div className="space-y-6">
      {/* 상단 액션 */}
      <div className="flex justify-end gap-2">
        <Link
          href={`/club/${clubId}/session/${sid}/edit`}
          className="bg-secondary text-secondary-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-[14px] px-3 text-sm font-medium"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Link>
        <DeleteSessionButton clubId={clubId} sessionId={sid} />
      </div>

      {/* 책 정보 */}
      {book && (
        <div className="bg-card flex gap-4 rounded-[20px] p-4 shadow-sm">
          <div className="bg-muted relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg">
            {book.cover_image_url ? (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="text-muted-foreground h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold">{book.title}</h2>
            {book.author && <p className="text-muted-foreground mt-0.5 text-sm">{book.author}</p>}
            {book.publisher && <p className="text-muted-foreground text-xs">{book.publisher}</p>}
          </div>
        </div>
      )}

      {/* 모임 정보 */}
      <div className="bg-card rounded-[20px] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {session.is_counted !== false && (
            <Badge variant="secondary" className="rounded-full">
              #{meetingNumber}회
            </Badge>
          )}
          <span className="text-muted-foreground flex items-center gap-1 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(session.session_date)}
          </span>
        </div>

        {session.presenter && session.presenter.length > 0 && (
          <div className="mt-3 flex items-start gap-2 text-sm">
            <User className="text-primary mt-0.5 h-4 w-4" />
            <div>
              <span className="font-medium">발제자:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {session.presenter.map((p: string) => (
                  <Badge key={p} variant="secondary" className="rounded-full text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {session.participants && session.participants.length > 0 && (
          <div className="mt-2 flex items-start gap-2 text-sm">
            <Users className="text-primary mt-0.5 h-4 w-4" />
            <div>
              <span className="font-medium">참여자:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {session.participants.map((p: string) => (
                  <Badge key={p} variant="secondary" className="rounded-full text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 발제문 */}
      {session.presentation_text && (
        <div className="bg-card rounded-[20px] p-4 shadow-sm">
          <h3 className="text-foreground mb-2 text-sm font-semibold">발제문</h3>
          <p className="text-foreground/80 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {session.presentation_text}
          </p>
        </div>
      )}

      {/* 모임 내용/후기 */}
      {session.content && (
        <div className="bg-card rounded-[20px] p-4 shadow-sm">
          <h3 className="text-foreground mb-2 text-sm font-semibold">모임 내용</h3>
          <p className="text-foreground/80 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {session.content}
          </p>
        </div>
      )}

      {/* 사진 */}
      <div className="bg-card rounded-[20px] p-4 shadow-sm">
        <PhotoUploader
          clubId={clubId}
          sessionId={sid}
          initialPhotos={(session.photos as string[] | null) ?? []}
        />
      </div>

      {/* 태그 */}
      {session.tags && session.tags.length > 0 && (
        <div className="bg-card rounded-[20px] p-4 shadow-sm">
          <div className="flex items-start gap-2 text-sm">
            <Tag className="text-primary mt-0.5 h-4 w-4" />
            <div>
              <span className="font-medium">태그:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {session.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 후기/댓글 */}
      <div className="bg-card rounded-[20px] p-4 shadow-sm">
        <SessionComments clubId={clubId} sessionId={sid} />
      </div>
    </div>
  );
}
