import { NextRequest, NextResponse } from "next/server";

interface KakaoBookDocument {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  authors: string[];
  publisher: string;
  translators: string[];
  thumbnail: string;
  datetime: string;
}

interface KakaoBookResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoBookDocument[];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "검색어가 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "카카오 API 설정이 필요합니다" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=10`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "도서 검색에 실패했습니다" }, { status: res.status });
    }

    const data: KakaoBookResponse = await res.json();

    const books = data.documents.map((doc) => {
      // ISBN: 공백으로 구분된 경우 ISBN13(뒤쪽) 우선
      const isbnParts = doc.isbn.split(" ");
      const isbn = isbnParts.length > 1 ? isbnParts[1] : isbnParts[0];

      return {
        title: doc.title,
        author: doc.authors.join(", "),
        publisher: doc.publisher,
        isbn,
        coverUrl: doc.thumbnail,
        description: doc.contents,
        pubdate: doc.datetime ? doc.datetime.split("T")[0].replace(/-/g, "") : "",
      };
    });

    return NextResponse.json({ books, total: data.meta.total_count });
  } catch {
    return NextResponse.json({ error: "도서 검색 중 오류가 발생했습니다" }, { status: 500 });
  }
}
