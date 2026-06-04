import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 1. Verify Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return Response.json(
        { error: "Cloudinary is not configured. Please add keys to .env.local" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { publicId, resourceType } = body;

    if (!publicId) {
      return Response.json({ error: "Missing publicId" }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "raw",
    });

    return Response.json({ success: true, result });
  } catch (error: any) {
    console.error("Delete Attachment API Error:", error);
    return Response.json(
      { error: error?.message || "Failed to delete attachment" },
      { status: 500 },
    );
  }
}
