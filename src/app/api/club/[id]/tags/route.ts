import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data, error } = await supabase.from("club_sessions").select("tags").eq("club_id", clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 모든 세션의 tags 배열을 flatten하고 고유값 추출
  const allTags = new Set<string>();
  for (const session of data ?? []) {
    const tags = (session.tags as string[] | null) ?? [];
    for (const tag of tags) {
      allTags.add(tag);
    }
  }

  const sortedTags = Array.from(allTags).sort();
  return NextResponse.json({ tags: sortedTags });
}
