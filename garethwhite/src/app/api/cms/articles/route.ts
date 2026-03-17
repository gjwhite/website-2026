import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import {
  fetchArticles,
  type ArticleListSortOrder,
} from "@/utils/fetchArticles";

function parseSortOrder(raw: string | null): ArticleListSortOrder | undefined {
  if (raw === "asc" || raw === "desc" || raw === "") return raw || undefined;
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const editor = searchParams.get("editor") === "1";
  const sortOrder = parseSortOrder(searchParams.get("sort"));
  let version: "draft" | "published" = "published";
  if (editor) {
    version = "draft";
  } else if (process.env.NODE_ENV === "development") {
    version = "draft";
  } else {
    const { isEnabled } = await draftMode();
    if (isEnabled) version = "draft";
  }

  try {
    const stories = await fetchArticles(version, sortOrder);
    return NextResponse.json(stories);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load articles" },
      { status: 502 },
    );
  }
}
