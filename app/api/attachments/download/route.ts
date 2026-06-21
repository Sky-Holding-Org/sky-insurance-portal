import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "attachment";

    if (!url) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let redirectUrl = url;

    // Parse Cloudinary URL to extract cloud name, resource type, and public ID
    const cloudinaryMatch = url.match(
      /res\.cloudinary\.com\/([^/]+)\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/
    );

    if (cloudinaryMatch) {
      const cloudName = cloudinaryMatch[1];
      const resourceType = cloudinaryMatch[2];
      const fullPublicId = cloudinaryMatch[3];

      let publicId = fullPublicId;
      let format: string | undefined = undefined;

      // For image/video type resources, split the extension from the public ID
      if (resourceType !== "raw") {
        const lastDotIndex = fullPublicId.lastIndexOf(".");
        if (lastDotIndex !== -1) {
          publicId = fullPublicId.slice(0, lastDotIndex);
          format = fullPublicId.slice(lastDotIndex + 1);
        }
      }

      // Configure Cloudinary with the correct credentials
      cloudinary.config({
        cloud_name: cloudName || process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Get filename without extension (Cloudinary appends the extension automatically)
      const lastDotIndex = filename.lastIndexOf(".");
      const nameWithoutExtension = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;

      // Sanitize the filename to avoid breaking URL structure (alphanumeric, dashes, underscores only)
      const cleanFilename = nameWithoutExtension
        .replace(/[^a-zA-Z0-9\-_]/g, "_")
        .replace(/\s+/g, "_");

      // Generate a signed URL with the fl_attachment flag.
      // Signing the URL overrides Cloudinary's default raw/PDF delivery restrictions (no 400/401 errors).
      redirectUrl = cloudinary.url(publicId, {
        resource_type: resourceType,
        format: format,
        sign_url: true,
        transformation: [
          { flags: `attachment:${cleanFilename}` }
        ],
        secure: true,
      });
    }

    // Redirect the browser directly to the generated URL.
    // This bypasses the Vercel Serverless Function response payload size limit (4.5 MB).
    return Response.redirect(redirectUrl, 302);
  } catch (error: any) {
    console.error("Download Attachment API Error:", error);
    return Response.json(
      { error: error?.message || "Failed to download attachment" },
      { status: 500 },
    );
  }
}
