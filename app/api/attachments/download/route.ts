export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "attachment";

    if (!url) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return Response.json(
        { error: "Failed to download file from storage provider" },
        { status: response.status },
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Download Attachment API Error:", error);
    return Response.json(
      { error: error?.message || "Failed to download attachment" },
      { status: 500 },
    );
  }
}
