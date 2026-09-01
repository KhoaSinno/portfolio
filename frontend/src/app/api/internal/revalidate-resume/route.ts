import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  PUBLIC_RESUME_CACHE_TAG,
  PUBLIC_RESUME_ID,
  savePublicResumeSnapshot,
} from "@/features/resume/public-resume-snapshot";

export const runtime = "nodejs";

type RevalidateRequest = {
  resumeId?: unknown;
  content?: unknown;
  sourceUpdatedAt?: unknown;
};

function hasValidBearerToken(request: Request) {
  const expected = process.env.RESUME_REVALIDATE_SECRET;
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(request: Request) {
  if (!hasValidBearerToken(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: RevalidateRequest;
  try {
    body = (await request.json()) as RevalidateRequest;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (body.resumeId !== PUBLIC_RESUME_ID) {
    return NextResponse.json(
      { message: "Unexpected resume ID" },
      { status: 400 },
    );
  }
  if (
    typeof body.sourceUpdatedAt !== "undefined" &&
    typeof body.sourceUpdatedAt !== "string"
  ) {
    return NextResponse.json(
      { message: "Invalid sourceUpdatedAt" },
      { status: 400 },
    );
  }

  try {
    await savePublicResumeSnapshot(body.content, body.sourceUpdatedAt);
    revalidateTag(PUBLIC_RESUME_CACHE_TAG, { expire: 0 });
    revalidatePath("/");
    revalidatePath("/resume");
    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error("public_resume.revalidate_failed", error);
    return NextResponse.json(
      { message: "Could not update the public resume cache." },
      { status: 500 },
    );
  }
}
