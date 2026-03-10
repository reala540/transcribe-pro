import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getRequiredEnv } from "@/lib/env";

let queue: Queue | null = null;
export function getTranscriptionQueue() {
  if (!queue) {
    const connection = new IORedis(getRequiredEnv("REDIS_URL"), { maxRetriesPerRequest: null });
    queue = new Queue("transcription", { connection });
  }
  return queue;
}
