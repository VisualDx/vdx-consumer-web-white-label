/**
 * API route to generate signed image URL
 * Server generates the signature to ensure consistency
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageId, size = "thumbnail" } = req.body;

  if (!imageId) {
    return res.status(400).json({ error: "Image ID is required" });
  }

  try {
    // Generate timestamp
    const timestamp = Date.now();
    
    // Generate signature server-side (same logic as image API)
    const secret = process.env.IMAGE_SECRET || "default-secret-change-in-production";
    const signature = Buffer.from(`${imageId}:${timestamp}:${secret}`).toString("base64");
    
    // Return signed URL parameters
    return res.status(200).json({
      imageId,
      size,
      timestamp,
      signature,
      url: `/api/images/${imageId}?size=${size}&ts=${timestamp}&sig=${encodeURIComponent(signature)}`,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}
