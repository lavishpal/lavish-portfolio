import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authed } from "../middleware/auth";
import { s3 } from "../lib/s3";
import { slugify } from "../lib/posts";

export const upload = {
  /** Presigned PUT for cover images and inline article images (admin only). */
  presign: authed
    .input(z.object({ filename: z.string().min(1), contentType: z.string().min(1) }))
    .handler(async ({ input }) => {
      const dot = input.filename.lastIndexOf(".");
      const ext = dot > -1 ? input.filename.slice(dot + 1).toLowerCase() : "bin";
      const name = slugify(dot > -1 ? input.filename.slice(0, dot) : input.filename) || "image";
      const key = `blog/${Date.now()}-${name}.${ext}`;

      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          ContentType: input.contentType,
        }),
        { expiresIn: 600 },
      );

      // Public read path served by the API (see /api/media/* in src/api/index.ts).
      return { url, key, publicUrl: `/api/media/${key}` };
    }),
};
