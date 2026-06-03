import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(req: Request) {
  try {
    // 1. Verify Cloudinary is configured
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return Response.json(
        { error: "Cloudinary is not configured. Please add keys to .env.local" },
        { status: 500 },
      );
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Validation
    const extIndex = file.name.lastIndexOf(".");
    if (extIndex === -1) {
      return Response.json({ error: "File has no extension" }, { status: 400 });
    }
    const ext = file.name.slice(extIndex).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // 4. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Determine resource type & Cloudinary upload options
    const isImage = file.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    const resourceType = isImage ? "image" : "raw";

    const uploadOptions: any = {
      resource_type: resourceType,
      folder: "quote_rule_attachments",
    };

    if (isImage) {
      uploadOptions.format = "webp";
      uploadOptions.quality = "auto";
    }

    // 6. Upload stream to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Stream Error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(buffer);
    });

    // 7. Return metadata
    return Response.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      fileSize: result.bytes || file.size,
      originalFileName: file.name,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return Response.json(
      { error: error?.message || "Internal server error uploading file" },
      { status: 500 },
    );
  }
}
