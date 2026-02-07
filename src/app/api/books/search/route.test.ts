import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// fetch를 전역으로 모킹
const mockFetch = vi.fn();

describe("GET /api/books/search", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("KAKAO_REST_API_KEY", "test-kakao-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("검색어가 없으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:9000/api/books/search");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("검색어가 필요합니다");
  });

  it("KAKAO_REST_API_KEY가 없으면 500을 반환한다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "");

    const req = new NextRequest("http://localhost:9000/api/books/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("카카오 API 설정이 필요합니다");
  });

  it("카카오 API 응답을 올바르게 변환한다", async () => {
    const kakaoResponse = {
      meta: {
        total_count: 1,
        pageable_count: 1,
        is_end: true,
      },
      documents: [
        {
          title: "데미안",
          contents: "자아를 찾아가는 청춘의 이야기",
          url: "https://example.com",
          isbn: "1234567890 9781234567890",
          authors: ["헤르만 헤세"],
          publisher: "민음사",
          translators: ["전영애"],
          thumbnail: "https://search1.kakaocdn.net/cover.jpg",
          datetime: "2020-01-01T00:00:00.000+09:00",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(kakaoResponse),
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=데미안");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.total).toBe(1);
    expect(data.books).toHaveLength(1);

    const book = data.books[0];
    expect(book.title).toBe("데미안");
    expect(book.author).toBe("헤르만 헤세");
    expect(book.description).toBe("자아를 찾아가는 청춘의 이야기");
    // ISBN13 우선
    expect(book.isbn).toBe("9781234567890");
    expect(book.publisher).toBe("민음사");
    expect(book.coverUrl).toBe("https://search1.kakaocdn.net/cover.jpg");
    expect(book.pubdate).toBe("20200101");
  });

  it("저자가 여러 명이면 쉼표로 구분한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          meta: { total_count: 1, pageable_count: 1, is_end: true },
          documents: [
            {
              title: "테스트",
              contents: "설명",
              url: "",
              isbn: "9781234567890",
              authors: ["작가1", "작가2"],
              publisher: "출판사",
              translators: [],
              thumbnail: "",
              datetime: "2020-01-01T00:00:00.000+09:00",
            },
          ],
        }),
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=test");
    const res = await GET(req);
    const data = await res.json();
    expect(data.books[0].author).toBe("작가1, 작가2");
  });

  it("ISBN이 하나만 있으면 그대로 사용한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          meta: { total_count: 1, pageable_count: 1, is_end: true },
          documents: [
            {
              title: "테스트",
              contents: "설명",
              url: "",
              isbn: "9781234567890",
              authors: ["작가"],
              publisher: "출판사",
              translators: [],
              thumbnail: "",
              datetime: "2020-01-01T00:00:00.000+09:00",
            },
          ],
        }),
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=test");
    const res = await GET(req);
    const data = await res.json();
    expect(data.books[0].isbn).toBe("9781234567890");
  });

  it("카카오 API가 에러를 반환하면 해당 상태 코드를 전달한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.error).toBe("도서 검색에 실패했습니다");
  });

  it("fetch가 실패하면 500을 반환한다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const req = new NextRequest("http://localhost:9000/api/books/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("도서 검색 중 오류가 발생했습니다");
  });

  it("검색어를 URL 인코딩하여 카카오 API에 전달한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          meta: { total_count: 0, pageable_count: 0, is_end: true },
          documents: [],
        }),
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=한글 검색어");
    await GET(req);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("한글 검색어")),
      expect.objectContaining({
        headers: {
          Authorization: "KakaoAK test-kakao-key",
        },
      })
    );
  });

  it("빈 결과를 올바르게 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          meta: { total_count: 0, pageable_count: 0, is_end: true },
          documents: [],
        }),
    });

    const req = new NextRequest("http://localhost:9000/api/books/search?q=존재하지않는책제목xyz");
    const res = await GET(req);
    const data = await res.json();

    expect(data.total).toBe(0);
    expect(data.books).toHaveLength(0);
  });
});
