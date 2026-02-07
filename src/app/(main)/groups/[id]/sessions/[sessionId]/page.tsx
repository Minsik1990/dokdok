import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { BookOpen, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { SessionWithBook, SessionReviewWithProfile } from "@/lib/supabase/types";
import { SessionReviewForm } from "./session-review-form";
import { AgentPanel } from "@/components/features/agent-panel";
import { SessionActions } from "./session-actions";
import { PresentationEditor } from "./presentation-editor";
import { ReviewItem } from "./review-item";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: session } = (await supabase
    .from("sessions")
    .select("books(title, author)")
    .eq("id", sessionId)
    .maybeSingle()) as { data: { books: { title: string; author: string } | null } | null };

  const bookTitle = session?.books?.title ?? "독서 세션";
  const description = `${bookTitle} 독서 모임 세션`;
  return {
    title: bookTitle,
    description,
    openGraph: {
      title: `${bookTitle} | 독독`,
      description,
    },
  };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: groupId, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: session } = (await supabase
    .from("sessions")
    .select("*, books(*)")
    .eq("id", sessionId)
    .single()) as { data: SessionWithBook | null };

  if (!session) notFound();

  const { data: reviews } = (await supabase
    .from("session_reviews")
    .select("*, profiles(nickname)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })) as { data: SessionReviewWithProfile[] | null };

  // 권한 확인
  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", session.group_id)
    .eq("user_id", user.id)
    .single();

  const isAdmin = member?.role === "admin";
  const isPresenter = session.presenter_id === user.id;

  const book = session.books;
  const bookContext = book
    ? { title: book.title, author: book.author, description: book.description }
    : undefined;

  return (
    <div className="space-y-6">
      {/* 세션 헤더 */}
      <div className="flex items-start gap-4">
        {book?.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            width={80}
            height={112}
            sizes="80px"
            className="h-28 w-20 rounded-xl object-cover shadow"
            priority
          />
        ) : (
          <div className="bg-muted flex h-28 w-20 items-center justify-center rounded-xl">
            <BookOpen className="text-muted-foreground h-8 w-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">{book?.title ?? "책 미정"}</h1>
          {book?.author && <p className="text-muted-foreground text-sm">{book.author}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={session.status === "upcoming" ? "outline" : "secondary"}>
              {session.status === "upcoming" ? "예정" : "완료"}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {new Date(session.session_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 세션 액션 (편집/삭제/상태변경) */}
      <SessionActions
        sessionId={sessionId}
        groupId={groupId}
        status={session.status}
        isAdmin={isAdmin}
        isPresenter={isPresenter}
      />

      {/* 발제문 */}
      {isPresenter ? (
        <PresentationEditor sessionId={sessionId} initialText={session.presentation_text ?? ""} />
      ) : session.presentation_text ? (
        <Card>
          <CardContent className="py-4">
            <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">발제문</h2>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {session.presentation_text}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* AI 에이전트 */}
      {bookContext && (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-[17px] font-semibold">AI 도우미</h2>
            <AgentPanel bookContext={bookContext} bookId={book?.id} />
          </section>
        </>
      )}

      <Separator />

      {/* 감상 섹션 */}
      <section className="space-y-4">
        <h2 className="text-[17px] font-semibold">감상 ({reviews?.length ?? 0})</h2>

        <SessionReviewForm sessionId={sessionId} />

        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} isOwner={review.user_id === user.id} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-[13px]">아직 감상이 없어요</p>
          </div>
        )}
      </section>
    </div>
  );
}
