import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/features/star-rating";
import { LogoutButton } from "./logout-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { data: records } = await supabase
    .from("records")
    .select("status, rating")
    .eq("user_id", user!.id);

  const completedCount = records?.filter((r) => r.status === "completed").length ?? 0;
  const readingCount = records?.filter((r) => r.status === "reading").length ?? 0;
  const wishlistCount = records?.filter((r) => r.status === "wishlist").length ?? 0;

  const ratings = records?.map((r) => r.rating).filter((r): r is number => r !== null) ?? [];
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold">프로필</h1>

      {/* 프로필 + 통계: PC에서 나란히 */}
      <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {/* 프로필 카드 */}
        <Card>
          <CardContent className="py-6 text-center">
            <div className="bg-primary text-primary-foreground mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
              {profile?.nickname?.charAt(0) ?? "?"}
            </div>
            <h2 className="mt-3 text-lg font-bold">{profile?.nickname ?? "독서가"}</h2>
            <p className="text-muted-foreground text-[13px]">{user?.email}</p>
          </CardContent>
        </Card>

        {/* 독서 통계 */}
        <Card>
          <CardContent className="py-4">
            <h3 className="text-muted-foreground mb-3 text-[13px] font-semibold">독서 통계</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-primary text-2xl font-bold">{completedCount}</p>
                <p className="text-muted-foreground text-[13px]">완독</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{readingCount}</p>
                <p className="text-muted-foreground text-[13px]">읽는 중</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{wishlistCount}</p>
                <p className="text-muted-foreground text-[13px]">읽고 싶은</p>
              </div>
            </div>
            {avgRating > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 border-t pt-3">
                <span className="text-muted-foreground text-[13px]">평균 별점</span>
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 로그아웃 */}
      <LogoutButton />
    </div>
  );
}
