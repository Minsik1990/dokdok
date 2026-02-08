import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("wishlist_books")
    .select("id, created_at, books(id, title, author, publisher, cover_image_url, description)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wishlistBooks: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  // 쿠키 검증
  const cookieClubId = request.cookies.get("club_id")?.value;
  if (!cookieClubId || cookieClubId !== clubId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const { isbn, title, author, publisher, coverUrl, description, infoUrl } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "책 제목이 필요합니다." }, { status: 400 });
  }

  const supabase = createClient();

  // books 테이블에 upsert (ISBN 기준)
  let bookId: string | null = null;

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
      if (infoUrl) updates.info_url = infoUrl;
      if (Object.keys(updates).length > 0) {
        await supabase.from("books").update(updates).eq("id", existing.id).is("info_url", null);
      }
    }
  }

  if (!bookId) {
    const { data: newBook, error: bookError } = await supabase
      .from("books")
      .insert({
        isbn: isbn || null,
        title: title.trim(),
        author: author || null,
        publisher: publisher || null,
        cover_image_url: coverUrl || null,
        description: description || null,
        info_url: infoUrl || null,
        api_source: "kakao",
      })
      .select("id")
      .single();

    if (bookError) {
      // Race condition: 다른 요청이 먼저 동일 ISBN을 삽입한 경우
      if (bookError.code === "23505" && isbn) {
        const { data: retried } = await supabase
          .from("books")
          .select("id")
          .eq("isbn", isbn)
          .single();
        if (retried) {
          bookId = retried.id;
        } else {
          return NextResponse.json({ error: bookError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: bookError.message }, { status: 500 });
      }
    } else {
      bookId = newBook.id;
    }
  }

  // wishlist_books에 추가
  const { data: wishlistBook, error: wishlistError } = await supabase
    .from("wishlist_books")
    .insert({ club_id: clubId, book_id: bookId })
    .select("id, created_at, books(id, title, author, publisher, cover_image_url, description)")
    .single();

  if (wishlistError) {
    if (wishlistError.code === "23505") {
      return NextResponse.json({ error: "이미 추가된 책입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: wishlistError.message }, { status: 500 });
  }

  return NextResponse.json({ wishlistBook }, { status: 201 });
}
