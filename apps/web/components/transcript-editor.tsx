"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Search, SkipBack, SkipForward } from "lucide-react";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";

type Segment = { id: string; startMs: number; endMs: number; speaker: string | null; text: string; isEdited?: boolean };
function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}` : `${minutes}:${String(secs).padStart(2,"0")}`;
}
export function TranscriptEditor({ projectId, mediaUrl, mediaType, initialSegments }: { projectId: string; mediaUrl?: string | null; mediaType?: string | null; initialSegments: Segment[] }) {
  const [segments, setSegments] = useState(initialSegments);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentsRef = useRef(initialSegments);
  const dirtyIdsRef = useRef(new Set<string>());
  const revisionRef = useRef(0);
  const segmentRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => { setSegments(initialSegments); segmentsRef.current = initialSegments; dirtyIdsRef.current = new Set(); revisionRef.current = 0; setSaveMessage(null); }, [initialSegments]);
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return segments.filter((segment) => segment.text.toLowerCase().includes(query)).map((segment) => segment.id);
  }, [segments, search]);
  useEffect(() => { if (activeMatchIndex >= matches.length) setActiveMatchIndex(matches.length > 0 ? 0 : 0); }, [matches.length, activeMatchIndex]);

  const persistChanges = useCallback(async () => {
    const dirtyIds = Array.from(dirtyIdsRef.current);
    if (dirtyIds.length === 0) return;
    const payload = segmentsRef.current.filter((segment) => dirtyIds.includes(segment.id)).map((segment) => ({ id: segment.id, speaker: segment.speaker, text: segment.text }));
    if (payload.length === 0) return;
    const revisionAtStart = revisionRef.current;
    setSaving(true); setSaveMessage("Saving...");
    try {
      const response = await fetch(`/api/projects/${projectId}/segments`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ segments: payload }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || "Failed to save transcript changes."); }
      if (revisionRef.current === revisionAtStart) { dirtyIdsRef.current.clear(); setSaveMessage("Saved"); } else setSaveMessage("Saved, more changes pending");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed.");
    } finally { setSaving(false); }
  }, [projectId]);
  function queueSave() { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => void persistChanges(), 800); }
  function updateSegments(updater: (current: Segment[]) => Segment[]) {
    setSegments((current) => { const next = updater(current); segmentsRef.current = next; revisionRef.current += 1; return next; });
  }
  function markDirty(id: string) { dirtyIdsRef.current.add(id); }
  function seekTo(targetSec: number, prerollSec = 0) { const media = mediaRef.current; if (!media) return; media.currentTime = Math.max(0, targetSec - prerollSec); setCurrentTimeSec(media.currentTime); }
  function togglePlay() { const media = mediaRef.current; if (!media) return; if (media.paused) void media.play(); else media.pause(); }
  function seekBy(deltaSec: number) { const media = mediaRef.current; if (!media) return; media.currentTime = Math.max(0, media.currentTime + deltaSec); setCurrentTimeSec(media.currentTime); }
  function setRate(next: number) { const media = mediaRef.current; if (!media) return; const safe = Math.max(0.5, Math.min(2, Number(next.toFixed(2)))); media.playbackRate = safe; setPlaybackRate(safe); }
  function focusSearch() { document.getElementById("transcript-search-input")?.focus(); }
  function goToMatch(index: number) { const matchId = matches[index]; if (!matchId) return; setActiveMatchIndex(index); segmentRefs.current.get(matchId)?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function replaceCurrent() {
    const matchId = matches[activeMatchIndex];
    const query = search.trim();
    if (!matchId || !query) return;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updateSegments((current) => current.map((segment) => segment.id === matchId ? { ...segment, text: segment.text.replace(new RegExp(escaped, "i"), replaceValue), isEdited: true } : segment));
    markDirty(matchId); queueSave();
  }
  function replaceAll() {
    const query = search.trim();
    if (!query) return;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const dirty: string[] = [];
    updateSegments((current) => current.map((segment) => {
      if (!regex.test(segment.text)) { regex.lastIndex = 0; return segment; }
      regex.lastIndex = 0; dirty.push(segment.id); return { ...segment, text: segment.text.replace(regex, replaceValue), isEdited: true };
    }));
    dirty.forEach(markDirty); queueSave();
  }
  useEditorShortcuts({ "toggle-play": togglePlay, "seek-backward": () => seekBy(-2), "seek-forward": () => seekBy(2), "speed-down": () => setRate(playbackRate - 0.1), "speed-up": () => setRate(playbackRate + 0.1), "speed-reset": () => setRate(1), "save-now": () => { void persistChanges(); }, find: focusSearch });
  useEffect(() => {
    const media = mediaRef.current; if (!media) return;
    function handleTimeUpdate() { const nextTime = media.currentTime; setCurrentTimeSec(nextTime); const active = segmentsRef.current.find((segment) => nextTime * 1000 >= segment.startMs && nextTime * 1000 < segment.endMs); setActiveSegmentId(active?.id ?? null); }
    function handleLoadedMetadata() { setDurationSec(Number.isFinite(media.duration) ? media.duration : 0); setPlaybackRate(media.playbackRate || 1); }
    function handlePlay() { setIsPlaying(true); } function handlePause() { setIsPlaying(false); } function handleRateChange() { setPlaybackRate(media.playbackRate || 1); }
    media.addEventListener("timeupdate", handleTimeUpdate); media.addEventListener("loadedmetadata", handleLoadedMetadata); media.addEventListener("play", handlePlay); media.addEventListener("pause", handlePause); media.addEventListener("ratechange", handleRateChange);
    handleLoadedMetadata(); handleTimeUpdate();
    return () => { media.removeEventListener("timeupdate", handleTimeUpdate); media.removeEventListener("loadedmetadata", handleLoadedMetadata); media.removeEventListener("play", handlePlay); media.removeEventListener("pause", handlePause); media.removeEventListener("ratechange", handleRateChange); };
  }, [mediaUrl]);
  useEffect(() => { if (!activeSegmentId || !isPlaying) return; segmentRefs.current.get(activeSegmentId)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [activeSegmentId, isPlaying]);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);
  return <div className="space-y-6"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={togglePlay} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-black">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{isPlaying ? "Pause" : "Play"} (Tab)</button><button type="button" onClick={() => seekBy(-2)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2"><SkipBack className="h-4 w-4" />Back 2s</button><button type="button" onClick={() => seekBy(2)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2"><SkipForward className="h-4 w-4" />Forward 2s</button><button type="button" onClick={() => setRate(playbackRate - 0.1)} className="rounded-xl border border-zinc-700 px-4 py-2">Slower</button><button type="button" onClick={() => setRate(playbackRate + 0.1)} className="rounded-xl border border-zinc-700 px-4 py-2">Faster</button><button type="button" onClick={() => setRate(1)} className="rounded-xl border border-zinc-700 px-4 py-2">1.0x</button><div className="ml-auto text-sm text-zinc-400">Rate: {playbackRate.toFixed(1)}x · {saving ? "Saving..." : saveMessage ?? "Saved"}</div></div>{mediaUrl ? <>{mediaType?.startsWith("video/") ? <video ref={mediaRef as React.RefObject<HTMLVideoElement>} controls className="mt-4 w-full rounded-xl" src={mediaUrl} /> : <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} controls className="mt-4 w-full" src={mediaUrl} />}<div className="mt-4 space-y-2"><input type="range" min={0} max={Math.max(durationSec, 1)} step={0.01} value={Math.min(currentTimeSec, durationSec || currentTimeSec)} onChange={(e) => seekTo(Number(e.target.value), 0)} className="w-full" aria-label="Media progress" /><div className="flex items-center justify-between text-xs text-zinc-500"><span>{formatTime(currentTimeSec)}</span><span>{formatTime(durationSec)}</span></div></div></> : <p className="mt-4 text-sm text-zinc-400">Media is not available for preview yet. Transcript editing still works.</p>}</div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="mb-4 flex flex-wrap items-center gap-3"><div className="relative min-w-[240px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input id=\"transcript-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder=\"Find text (Cmd/Ctrl + F)" className=\"w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 outline-none focus:border-zinc-600" /></div><input value={replaceValue} onChange={(e) => setReplaceValue(e.target.value)} placeholder=\"Replace with" className=\"min-w-[180px] rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600" /><button type=\"button" onClick={() => goToMatch(Math.max(0, activeMatchIndex - 1))} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Previous</button><button type="button" onClick={() => goToMatch(Math.min(matches.length - 1, activeMatchIndex + 1))} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Next</button><button type="button" onClick={replaceCurrent} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Replace</button><button type="button" onClick={replaceAll} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Replace all</button></div><p className="mb-4 text-sm text-zinc-500">{search.trim() ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : "Search, replace, and navigate transcript text."}</p><div className="space-y-4">{segments.map((segment) => { const isActive = segment.id === activeSegmentId; const isMatched = search.trim().length > 0 && segment.text.toLowerCase().includes(search.trim().toLowerCase()); return <div key={segment.id} ref={(node) => { if (node) segmentRefs.current.set(segment.id, node); else segmentRefs.current.delete(segment.id); }} className={`rounded-xl border p-4 transition ${isActive ? "border-sky-500 bg-zinc-900 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]" : "border-zinc-800 bg-zinc-950"}`}><div className="mb-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => { const media = mediaRef.current; if (!media) return; seekTo(segment.startMs / 1000, 1); void media.play(); }} className="rounded-lg border border-zinc-700 px-3 py-1 text-xs uppercase tracking-wide text-zinc-300">{formatTime(segment.startMs / 1000)}</button><input value={segment.speaker ?? ""} onChange={(e) => { const speaker = e.target.value; updateSegments((current) => current.map((item) => item.id === segment.id ? { ...item, speaker, isEdited: true } : item)); markDirty(segment.id); queueSave(); }} placeholder="Speaker" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm outline-none" />{segment.isEdited ? <span className="text-xs text-amber-400">Edited</span> : null}{isMatched ? <span className="text-xs text-sky-400">Search match</span> : null}</div><textarea value={segment.text} onChange={(e) => { const text = e.target.value; updateSegments((current) => current.map((item) => item.id === segment.id ? { ...item, text, isEdited: true } : item)); markDirty(segment.id); queueSave(); }} className="min-h-[110px] w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 leading-7 outline-none focus:border-zinc-600" /></div>; })}</div></div></div>;
}
