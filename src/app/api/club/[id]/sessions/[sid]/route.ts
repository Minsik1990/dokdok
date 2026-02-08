import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid } = await params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("club_sessions")
    .select("*, books(*)")
    .eq("id", sid)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createClient();

  // 책 정보 업데이트
  let bookId: string | null = body.bookId ?? null;
  if (body.book) {
    const { isbn, title, author, publisher, coverUrl, description } = body.book;

    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .maybeSingle();

      if (existing) {
        bookId = existing.id;
        // 기존 책의 누락된 필드 업데이트
        const updates: Record<string, string> = {};
        if (description) updates.description = description;
        if (Object.keys(updates).length > 0) {
          await supabase.from("books").update(updates).eq("id", existing.id);
        }
      }
    }

    if (!bookId) {
      const { data: newBook } = await supabase
        .from("books")
        .insert({
          isbn: isbn || null,
          title,
          author,
          publisher,
          cover_image_url: coverUrl || null,
          description: description || null,
        })
        .select("id")
        .single();

      if (newBook) bookId = newBook.id;
    }
  }

  const { data: session, error } = await supabase
    .from("club_sessions")
    .update({
      book_id: bookId,
      session_date: body.sessionDate,
      presenter: body.presenter || [],
      participants: body.participants || [],
      presentation_text: body.presentationText || null,
      content: body.content || null,
      photos: body.photos || [],
      is_counted: body.isCounted ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sid)
    .eq("club_id", clubId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 멤버 이름 자동 등록
  const names = new Set<string>();
  if (body.presenter) (body.presenter as string[]).forEach((n: string) => names.add(n));
  if (body.participants) (body.participants as string[]).forEach((n: string) => names.add(n));

  if (names.size > 0) {
    const membersToInsert = Array.from(names).map((name) => ({
      club_id: clubId,
      name,
    }));
    await supabase.from("members").upsert(membersToInsert, {
      onConflict: "club_id,name",
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ session });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: clubId, sid } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("club_sessions")
    .delete()
    .eq("id", sid)
    .eq("club_id", clubId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
