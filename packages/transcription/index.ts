import { createClient as createDeepgramClient } from "@deepgram/sdk";

export type TranscriptSegmentInput = { startMs: number; endMs: number; speaker?: string | null; text: string; confidence?: number | null; orderIndex: number };
export type TranscriptionResult = { text: string; language?: string; durationSec?: number; segments: TranscriptSegmentInput[]; raw?: unknown };
export interface TranscriptionProvider { transcribeFromUrl(input: { mediaUrl: string; language?: string }): Promise<TranscriptionResult>; }

function normalizeTranscriptResult(result: any): TranscriptionResult {
  const channel = result?.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  if (!alt) throw new Error("Transcription provider returned no alternatives.");
  const paragraphSegments = Array.isArray(alt?.paragraphs?.paragraphs) ? alt.paragraphs.paragraphs.map((p: any, idx: number) => ({
    startMs: Math.round((p.start ?? 0) * 1000),
    endMs: Math.round((p.end ?? p.start ?? 0) * 1000),
    speaker: p.speaker != null ? `Speaker ${p.speaker}` : null,
    text: Array.isArray(p.sentences) ? p.sentences.map((s: any) => s.text).join(" ").trim() : "",
    confidence: typeof alt.confidence === "number" ? alt.confidence : null,
    orderIndex: idx
  })) : [];
  const utteranceSegments = paragraphSegments.length > 0 ? [] : (Array.isArray(result?.results?.utterances) ? result.results.utterances : []).map((u: any, idx: number) => ({
    startMs: Math.round((u.start ?? 0) * 1000),
    endMs: Math.round((u.end ?? u.start ?? 0) * 1000),
    speaker: u.speaker != null ? `Speaker ${u.speaker}` : null,
    text: typeof u.transcript === "string" ? u.transcript.trim() : "",
    confidence: typeof u.confidence === "number" ? u.confidence : null,
    orderIndex: idx
  }));
  const fallback = paragraphSegments.length === 0 && utteranceSegments.length === 0 ? [{ startMs: 0, endMs: Math.round((result?.metadata?.duration ?? 0) * 1000), speaker: null, text: typeof alt.transcript === "string" ? alt.transcript : "", confidence: typeof alt.confidence === "number" ? alt.confidence : null, orderIndex: 0 }] : [];
  const segments = [...paragraphSegments, ...utteranceSegments, ...fallback].filter((s) => s.text.trim().length > 0).map((s, index) => ({ ...s, orderIndex: index }));
  return { text: typeof alt.transcript === "string" ? alt.transcript : "", language: typeof channel?.detected_language === "string" ? channel.detected_language : undefined, durationSec: typeof result?.metadata?.duration === "number" ? Math.round(result.metadata.duration) : undefined, segments, raw: result };
}
class DeepgramProvider implements TranscriptionProvider {
  async transcribeFromUrl(input: { mediaUrl: string; language?: string }): Promise<TranscriptionResult> {
    if (!process.env.DEEPGRAM_API_KEY) throw new Error("Missing DEEPGRAM_API_KEY");
    const client = createDeepgramClient(process.env.DEEPGRAM_API_KEY);
    const response = await client.listen.prerecorded.transcribeUrl({ url: input.mediaUrl }, { model: "nova-2", punctuate: true, diarize: true, paragraphs: true, utterances: true, smart_format: true, detect_language: !input.language, language: input.language });
    if (!response.result) throw new Error("Deepgram returned an empty result.");
    return normalizeTranscriptResult(response.result);
  }
}
export function getTranscriptionProvider(): TranscriptionProvider {
  if (process.env.TRANSCRIPTION_PROVIDER === "deepgram") return new DeepgramProvider();
  throw new Error(`Unsupported transcription provider: ${process.env.TRANSCRIPTION_PROVIDER}`);
}
