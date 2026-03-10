"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function ProjectStatusPoller({ projectId, enabled }: { projectId: string; enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(async () => {
      const response = await fetch(`/api/projects/${projectId}/status`, { cache: "no-store" });
      if (!response.ok) return;
      const { project } = await response.json();
      if (["COMPLETED", "FAILED"].includes(project.status)) router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [enabled, projectId, router]);
  return null;
}
