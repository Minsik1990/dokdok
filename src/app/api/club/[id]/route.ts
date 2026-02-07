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

  // 모임 이름 변경 시 중복 체크
  if (name) {
    const trimmedName = name.trim();
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("name", trimmedName)
      .neq("id", clubId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 모임 이름입니다." }, { status: 409 });
    }
  }

  // 접속 코드 유효성 검사 (중복 허용)
  const { accessCode } = body;
  if (accessCode !== undefined) {
    const trimmed = (accessCode as string).trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ error: "접속 코드는 2자 이상이어야 합니다." }, { status: 400 });
    }
  }

  // 업데이트
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (name) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description ?? null;
  if (accessCode !== undefined) updateData.access_code = (accessCode as string).trim();

  const { data: updated, error } = await supabase
    .from("clubs")
    .update(updateData)
    .eq("id", clubId)
    .select("id, name, description, access_code, cover_image_url")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 모임 이름입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "모임 정보 수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ club: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const { adminPassword } = body;

  if (!adminPassword) {
    return NextResponse.json({ error: "관리자 비밀번호가 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("admin_password_hash")
    .eq("id", clubId)
    .maybeSingle();

  if (!club) {
    return NextResponse.json({ error: "모임을 찾을 수 없습니다." }, { status: 404 });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(adminPassword, club.admin_password_hash);
  if (!valid) {
    return NextResponse.json({ error: "관리자 비밀번호가 일치하지 않습니다." }, { status: 403 });
  }

  // CASCADE로 members, club_sessions(→session_comments) 자동 삭제
  const { error } = await supabase.from("clubs").delete().eq("id", clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 쿠키 제거
  const response = NextResponse.json({ success: true });
  response.cookies.set("club_id", "", { maxAge: 0, path: "/" });
  response.cookies.set("club_name", "", { maxAge: 0, path: "/" });

  return response;
}
