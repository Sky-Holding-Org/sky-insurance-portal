import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return Response.json(
        { error: "Cloudinary credentials are not fully configured in environment variables." },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = body.folder || "quote_rule_attachments";

    // Generate standard signature for Cloudinary upload parameters
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    return Response.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: any) {
    console.error("Cloudinary Signature API Error:", error);
    return Response.json(
      { error: error?.message || "Internal server error generating upload signature" },
      { status: 500 },
    );
  }
}
