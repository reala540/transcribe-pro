import { Document, Packer, Paragraph, TextRun } from "docx";
type Segment = { startMs: number; endMs: number; speaker: string | null; text: string };
type Project = { title: string; segments: Segment[] };
function sanitizeFilename(input: string) { return input.replace(/[\\/:*?"<>|]+/g, "_").trim() || "transcript"; }
export function getExportFilename(title: string, extension: string) { return `${sanitizeFilename(title)}.${extension}`; }
function formatTimestamp(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = safeMs % 1000;
  return {
    srt: `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")},${String(millis).padStart(3,"0")}`,
    short: `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`
  };
}
export async function exportProjectToTxt(project: Project) { return project.segments.map((segment) => `[${formatTimestamp(segment.startMs).short}] ${segment.speaker ? `${segment.speaker}: ` : ""}${segment.text}`).join("\n\n"); }
export async function exportProjectToSrt(project: Project) { return project.segments.map((segment, index) => `${index + 1}\n${formatTimestamp(segment.startMs).srt} --> ${formatTimestamp(segment.endMs).srt}\n${segment.text}`).join("\n\n"); }
export async function exportProjectToDocx(project: Project) {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: project.title, bold: true, size: 32 })] }), ...project.segments.map((segment) => new Paragraph({ children: [new TextRun({ text: `[${formatTimestamp(segment.startMs).short}] ${segment.speaker ? `${segment.speaker}: ` : ""}`, bold: true }), new TextRun({ text: segment.text })] }))] }] });
  return Packer.toBuffer(doc);
}
