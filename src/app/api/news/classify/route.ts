import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { NewsSection, NEWS_SECTIONS } from "@/lib/types";
import { classifyHeadlines } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  const { headlines } = await request.json();

  if (!Array.isArray(headlines) || headlines.length === 0) {
    return NextResponse.json({ error: "headlines array required" }, { status: 400 });
  }

  try {
    const classifications = await classifyHeadlines(headlines);

    const validated = classifications.map((c) => ({
      index: c.index,
      section: NEWS_SECTIONS.includes(c.section as NewsSection) ? c.section : "Other",
    }));

    return NextResponse.json({ classifications: validated });
  } catch {
    return NextResponse.json({ error: "Failed to parse classification response" }, { status: 500 });
  }
}
