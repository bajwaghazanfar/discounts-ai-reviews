import { UPLOAD_FILE } from "app/graphql/files";
import { authenticate } from "app/shopify.server";
import { Buffer } from "buffer";
import { Storage } from "@google-cloud/storage";

export async function uploadImageToShopify(
  request: Request,
  file: File,
): Promise<string> {
  const { admin } = await authenticate.admin(request);
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";
  const storage = new Storage({
    keyFilename: "./kempt-collective-32f92f069dde.json",
  });
  const bucketName = "kempt-ai-reviews";
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_"); // replaces unsafe characters
  const fileName = `review-images/${Date.now()}-${safeName}`;

  const bucket = storage.bucket(bucketName);
  const gcsFile = bucket.file(fileName);

  await gcsFile.save(buffer, {
    metadata: { contentType: file.type || "image/jpeg" },
    resumable: false,
  });
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

  return publicUrl;
}
