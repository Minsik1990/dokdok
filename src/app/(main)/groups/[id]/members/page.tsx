import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MemberActions } from "./member-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "멤버 관리",
};

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("reading_groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profiles(nickname)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  // 현재 유저의 역할 확인
  const myRole = members?.find((m) => m.user_id === user.id)?.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold">멤버 관리</h1>
        <p className="text-muted-foreground mt-1 text-sm">{group.name}</p>
      </div>

      <div className="space-y-3">
        {members?.map((member) => {
          const nickname =
            (member.profiles as unknown as { nickname: string } | null)?.nickname ?? "알 수 없음";
          const userId = member.user_id ?? "";
          const isSelf = userId === user.id;

          return (
            <Card key={userId}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                    {nickname.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {nickname}
                      {isSelf && <span className="text-muted-foreground ml-1 text-xs">(나)</span>}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {member.joined_at
                        ? `${new Date(member.joined_at).toLocaleDateString("ko-KR")} 가입`
                        : "가입일 미상"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" && (
                    <Badge variant="secondary" className="text-xs">
                      관리자
                    </Badge>
                  )}
                  <MemberActions
                    groupId={groupId}
                    targetUserId={userId}
                    targetRole={member.role ?? "member"}
                    isSelf={isSelf}
                    isAdmin={myRole === "admin"}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
