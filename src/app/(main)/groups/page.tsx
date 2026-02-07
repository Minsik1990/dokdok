import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/features/empty-state";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 내가 가입한 모임 조회
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role, reading_groups(id, name, description, invite_code)")
    .eq("user_id", user!.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold">내 독서 모임</h1>
        <Button asChild size="sm">
          <Link href="/groups/new">
            <Plus className="mr-1 h-4 w-4" />새 모임
          </Link>
        </Button>
      </div>

      {!memberships || memberships.length === 0 ? (
        <EmptyState
          icon={Users}
          title="참여 중인 독서 모임이 없어요"
          description="새 모임을 만들거나, 초대 코드로 참여해보세요"
          action={
            <Button asChild>
              <Link href="/groups/new">첫 모임 만들기</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {memberships.map((membership) => {
            const group = membership.reading_groups as unknown as {
              id: string;
              name: string;
              description: string;
              invite_code: string;
            };
            if (!group) return null;
            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-sm">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-[15px] font-semibold">{group.name}</h2>
                        {group.description && (
                          <p className="text-muted-foreground mt-1 text-[13px]">
                            {group.description}
                          </p>
                        )}
                      </div>
                      {membership.role === "admin" && (
                        <Badge variant="secondary" className="text-xs">
                          관리자
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
