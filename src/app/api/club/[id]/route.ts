import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  // 쿠키가 일치하면 access_code 포함
  const cookieClubId = request.cookies.get("club_id")?.value;
  const isAuthenticated = cookieClubId === clubId;

  const selectFields = isAuthenticated
    ? "id, name, description, access_code, cover_image_url, created_at"
    : "id, name, description, cover_image_url, created_at";

  const { data: club, error } = await supabase
    .from("clubs")
    .select(selectFields)
    .eq("id", clubId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!club) {
    return NextResponse.json({ error: "모임을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ club });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, adminPassword } = body;

  if (!adminPassword) {
    return NextResponse.json({ error: "관리자 비밀번호가 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();

  // 관리자 비밀번호 확인
  const { data: club } = await supabase
    .from("clubs")
    .select("admin_password_hash")
    .eq("id", clubId)
    .maybeSingle();

  if (!club) {
    return NextResponse.json({ error: "모임을 찾을 수 없습니다." }, { status: 404 });
  }

  // bcryptjs는 동적 import
  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(adminPassword, club.admin_password_hash);
  if (!valid) {
    return NextResponse.json({ error: "관리자 비밀번호가 일치하지 않습니다." }, { status: 403 });
  }

  // 업데이트
  const { data: updated, error } = await supabase
    .from("clubs")
    .update({
      name: name || undefined,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubId)
    .select("id, name, description, access_code, cover_image_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ club: updated });
}
