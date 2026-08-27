import { NextResponse } from "next/server";
import { getUserId } from "@/server/session";
import { generateAuth, imagekitPublicKey, imagekitUrlEndpoint } from "@/lib/imagekit";

/*
 * Returns ImageKit upload-auth params + the public key the client needs to
 * push a file directly via <IKUpload />. We never proxy the bytes — the
 * browser uploads straight to ImageKit and we just record the returned
 * filePath in Mongo.
 */

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const params = generateAuth();
    return NextResponse.json({
      publicKey: imagekitPublicKey(),
      urlEndpoint: imagekitUrlEndpoint(),
      ...params,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ImageKit not configured" },
      { status: 500 },
    );
  }
}
