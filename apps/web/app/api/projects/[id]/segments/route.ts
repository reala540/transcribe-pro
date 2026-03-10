import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { UpdateSegmentsSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserRecord();
    const { id } = await params;
    const parsed = UpdateSegmentsSchema.parse(await request.json());

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id }
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    for (const update of parsed.segments) {
      const segment = await prisma.transcriptSegment.findFirst({
        where: {
          id: update.id,
          projectId: id
        }
      });

      if (!segment) {
        continue;
      }

      const nextText =
        typeof update.text === "string" ? update.text : segment.text;

      const nextSpeaker =
        typeof update.speaker === "string"
          ? update.speaker
          : update.speaker === null
            ? null
            : segment.speaker;

      await prisma.transcriptSegment.update({
        where: { id: segment.id },
        data: {
          text: nextText,
          speaker: nextSpeaker,
          isEdited:
            nextText !== segment.text || nextSpeaker !== segment.speaker
              ? true
              : segment.isEdited,
          originalText:
            nextText !== segment.text
              ? (segment.originalText ?? segment.text)
              : segment.originalText
        }
      });
    }

    await prisma.project.update({
      where: { id },
      data: {
        lastEditedAt: new Date()
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("api/projects/[id]/segments.PATCH", error);
    return toErrorResponse(error);
  }
}
