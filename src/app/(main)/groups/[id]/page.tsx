import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Plus, Calendar, BookOpen, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { ReadingGroup, SessionWithBook } from "@/lib/supabase/types";
import { InviteShare } from "@/components/features/invite-share";
import { GroupActions } from "./group-actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("reading_groups")
    .select("name, description")
    .eq("id", id)
    .single();

  if (!group) return { title: "모임" };

  return {
    title: group.name,
    description: group.description || `${group.name} 독서 모임`,
  };
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("reading_groups")
    .select("*")
    .eq("id", id)
    .single<ReadingGroup>();

  if (!group) notFound();

  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*, books(*)")
    .eq("group_id", id)
    .order("session_date", { ascending: false })) as { data: SessionWithBook[] | null };

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, profiles(nickname)")
    .eq("group_id", id);

  const myRole = members?.find((m) => m.user_id === user.id)?.role;
  const isAdmin = myRole === "admin";

  const upcomingSessions = sessions?.filter((s) => s.status === "upcoming") ?? [];
  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      {/* 모임 헤더 */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground mt-1 text-[15px]">{group.description}</p>
          )}
        </div>
        {isAdmin && <GroupActions groupId={id} groupName={group.name} />}
      </div>

      {/* 멤버 + 초대 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              멤버 ({members?.length ?? 0}명)
            </h2>
            <div className="flex items-center gap-2">
              <InviteShare inviteCode={group.invite_code} groupName={group.name} />
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/groups/${id}/members`}>전체보기</Link>
              </Button>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {members?.slice(0, 5).map((member) => {
              const nickname =
                (member.profiles as unknown as { nickname: string } | null)?.nickname ?? "?";
              return (
                <div
                  key={member.user_id}
                  className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  title={nickname}
                >
                  {nickname.charAt(0)}
                </div>
              );
            })}
            {(members?.length ?? 0) > 5 && (
              <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs">
                +{(members?.length ?? 0) - 5}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 새 세션 추가 */}
      <Button asChild className="w-full">
        <Link href={`/groups/${id}/sessions/new`}>
          <Plus className="mr-2 h-4 w-4" />새 독서 세션 추가
        </Link>
      </Button>

      {/* 다가오는 세션 */}
      {upcomingSessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold">
            <Calendar className="h-4 w-4" />
            다가오는 모임
          </h2>
          {upcomingSessions.map((session) => (
            <Link key={session.id} href={`/groups/${id}/sessions/${session.id}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      width={48}
                      height={64}
                      sizes="48px"
                      className="h-16 w-12 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 items-center justify-center rounded">
                      <BookOpen className="text-muted-foreground h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">
                      {session.books?.title ?? "책 미정"}
                    </p>
                    <p className="text-muted-foreground text-[13px]">
                      {new Date(session.session_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline">예정</Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {/* 지난 세션 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold">
          <BookOpen className="h-4 w-4" />
          지난 모임
        </h2>
        {completedSessions.length === 0 && upcomingSessions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-[13px]">아직 모임 기록이 없어요</p>
          </div>
        ) : (
          completedSessions.map((session) => (
            <Link key={session.id} href={`/groups/${id}/sessions/${session.id}`}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  {session.books?.cover_image_url ? (
                    <Image
                      src={session.books.cover_image_url}
                      alt={session.books.title}
                      width={48}
                      height={64}
                      sizes="48px"
                      className="h-16 w-12 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-muted flex h-16 w-12 items-center justify-center rounded">
                      <BookOpen className="text-muted-foreground h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">
                      {session.books?.title ?? "책 미정"}
                    </p>
                    <p className="text-muted-foreground text-[13px]">
                      {new Date(session.session_date).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">완료</Badge>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
