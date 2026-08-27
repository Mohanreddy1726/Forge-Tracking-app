import ImageKit from "imagekit";

/*
 * Server-side ImageKit client. Lazily constructed so missing env vars don't
 * crash the dev server at boot — only photo routes blow up, with a clear
 * "ImageKit not configured" message.
 *
 * We expose two helpers used by the /api/photos routes:
 *   - generateAuth(): signed params the browser passes to <IKUpload /> so it
 *     can push the file straight to ImageKit without our server proxying it.
 *   - signedUrl(path): for *private* images, returns a URL with an expiring
 *     signature. Public files don't need this.
 */

let cached: ImageKit | null = null;

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function imagekit(): ImageKit {
  if (cached) return cached;
  cached = new ImageKit({
    publicKey: getEnv("IMAGEKIT_PUBLIC_KEY"),
    privateKey: getEnv("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: getEnv("IMAGEKIT_URL_ENDPOINT"),
  });
  return cached;
}

export function imagekitPublicKey(): string {
  return getEnv("IMAGEKIT_PUBLIC_KEY");
}

export function imagekitUrlEndpoint(): string {
  return getEnv("IMAGEKIT_URL_ENDPOINT");
}

/**
 * Returns the auth blob the client passes straight to <IKUpload />. Token +
 * signature + expire are required by ImageKit's browser-side upload API.
 */
export function generateAuth(): { token: string; expire: number; signature: string } {
  const ik = imagekit();
  return ik.getAuthenticationParameters();
}

/**
 * Build a signed (private) URL for a stored file. Default expiry: 1 hour.
 * Returned in the GET /api/photos response so <img> tags render directly
 * without an extra round trip.
 */
export function signedUrl(
  filePath: string,
  expireSeconds = 3600,
): string {
  const ik = imagekit();
  return ik.url({
    path: filePath,
    signed: true,
    expireSeconds,
  });
}

/** Best-effort delete — used when a row is removed. */
export async function deleteFile(fileId: string): Promise<void> {
  const ik = imagekit();
  await ik.deleteFile(fileId);
}
