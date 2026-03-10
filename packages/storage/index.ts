import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function req(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
function opt(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}
let client: S3Client | null = null;
export function getStorageClient() {
  if (!client) {
    client = new S3Client({
      region: req("S3_REGION"),
      endpoint: req("S3_ENDPOINT"),
      credentials: { accessKeyId: req("S3_ACCESS_KEY_ID"), secretAccessKey: req("S3_SECRET_ACCESS_KEY") }
    });
  }
  return client;
}
export function getStorageBucketName() { return req("S3_BUCKET_NAME"); }
export async function createPresignedUpload(params: { key: string; contentType: string; expiresInSec?: number }) {
  const command = new PutObjectCommand({ Bucket: getStorageBucketName(), Key: params.key, ContentType: params.contentType });
  const uploadUrl = await getSignedUrl(getStorageClient(), command, { expiresIn: params.expiresInSec ?? 600 });
  const publicBase = opt("S3_PUBLIC_URL_BASE");
  return { uploadUrl, key: params.key, publicUrl: publicBase ? `${publicBase.replace(/\/$/, "")}/${params.key}` : null };
}
export async function createSignedReadUrl(params: { key: string; expiresInSec?: number }) {
  const command = new GetObjectCommand({ Bucket: getStorageBucketName(), Key: params.key });
  return getSignedUrl(getStorageClient(), command, { expiresIn: params.expiresInSec ?? 1800 });
}
export async function objectExists(key: string) {
  try {
    await getStorageClient().send(new HeadObjectCommand({ Bucket: getStorageBucketName(), Key: key }));
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException && (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404)) return false;
    if (typeof error === "object" && error && "name" in error && (error as {name?: string}).name === "NotFound") return false;
    throw error;
  }
}
export async function resolveMediaAccessUrl(params: { storageKey?: string | null; sourceUrl?: string | null; expiresInSec?: number }) {
  if (params.storageKey) return createSignedReadUrl({ key: params.storageKey, expiresInSec: params.expiresInSec });
  if (params.sourceUrl) return params.sourceUrl;
  return null;
}
