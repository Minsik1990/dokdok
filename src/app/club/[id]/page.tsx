import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface SessionWithBook {
  id: string;
  session_number: number | null;
  session_date: string;
  presenter: string | null;
  books: {
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
}

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data: sessions } = await supabase
    .from("club_sessions")
    .select("id, session_number, session_date, presenter, books(title, author, cover_image_url)")
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

  // 월별 그룹화
  const grouped = new Map<string, SessionWithBook[]>();
  for (const session of typedSessions) {
    const date = new Date(session.session_date);
    const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(session);
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([month, items]) => (
        <section key={month}>
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold">{month}</h2>
          <div className="grid grid-cols-3 gap-3">
            {items.map((session) => (
              <Link
                key={session.id}
                href={`/club/${clubId}/session/${session.id}`}
                className="group"
              >
                <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-[14px]">
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      fill
                      sizes="(max-width: 480px) 33vw, 150px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center">
                      <span className="text-muted-foreground text-xs">
                        {session.books?.title ?? `#${session.session_number}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <p className="truncate text-xs font-medium">
                    {session.books?.title ?? `제${session.session_number}회`}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {session.presenter ?? ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
