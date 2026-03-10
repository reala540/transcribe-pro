import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import {
  exportProjectToDocx,
  exportProjectToSrt,
  exportProjectToTxt,
  getExportFilename
} from "@/lib/exporters";
import { trackUsage } from "@/lib/usage/track-usage";
import { ExportProjectSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserRecord();
    const entitlements = await getUserEntitlements(user.id, user.plan);

    if (!entitlements.exportsEnabled) {
      throw new AppError("Exports are not enabled for your plan.", 403);
    }

    const { id } = await params;
    const parsed = ExportProjectSchema.parse(await request.json());

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        segments: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.status !== "COMPLETED" || project.segments.length === 0) {
      throw new AppError(
        "Transcript export is only available after completion.",
        409
      );
    }

    await trackUsage({
      userId: user.id,
      projectId: project.id,
      type: "EXPORT_COUNT",
      value: 1,
      metadata: { format: parsed.format }
    });

    if (parsed.format === "TXT") {
      return new NextResponse(await exportProjectToTxt(project), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${getExportFilename(project.title, "txt")}"`
        }
      });
    }

    if (parsed.format === "SRT") {
      return new NextResponse(await exportProjectToSrt(project), {
        headers: {
          "Content-Type": "application/x-subrip",
          "Content-Disposition": `attachment; filename="${getExportFilename(project.title, "srt")}"`
        }
      });
    }

    const docxBuffer = await exportProjectToDocx(project);

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${getExportFilename(project.title, "docx")}"`
      }
    });
  } catch (error) {
    logError("api/projects/[id]/export.POST", error);
    return toErrorResponse(error);
  }
}
