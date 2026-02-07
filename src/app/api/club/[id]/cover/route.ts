import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("cover") as File | null;

  if (!file) {
    return NextResponse.json({ error: "이미지를 선택해주세요." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 크기는 5MB 이하만 가능합니다." }, { status: 400 });
  }

  const supabase = createClient();

  const ext = file.name.split(".").pop() || "jpg";
  const path = `clubs/${clubId}/cover-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("session-photos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[cover] upload error:", uploadError.message);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("session-photos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("clubs")
    .update({ cover_image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", clubId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ coverUrl: urlData.publicUrl }, { status: 201 });
}
