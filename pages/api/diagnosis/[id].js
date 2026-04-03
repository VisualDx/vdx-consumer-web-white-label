import config from "@/config";
import {
  validateApiRequest,
  checkRateLimit,
  getClientIdentifier,
} from "@/middleware/auth";
import { getAuthToken } from "@/utils/tokenManager";

/**
 * API route to fetch diagnosis detail by ID
 * Returns diagnosis information including images and text sections
 */
export default async function handler(req, res) {
  // Layer 1: Validate request origin and app key
  const validation = validateApiRequest(req);
  if (!validation.valid) {
    return res.status(validation.code).json({ error: validation.error });
  }

  // Layer 2: Rate limiting
  const clientId = getClientIdentifier(req);
  const rateCheck = await checkRateLimit(clientId);
  if (!rateCheck.allowed) {
    return res.status(rateCheck.code).json({ error: rateCheck.error });
  }

  const { id, viewId, findingIds } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Diagnosis ID is required" });
  }

  try {
    // Fetch token server-side for security
    const token = await getAuthToken();

    const audience = config.AUDIENCE;

    // Build VisualDx URL:
    // /v1/libraries/{audience}/diagnoses/{id}?viewId=...&textFormat=html&findingIds=...&findingIds=...
    const qs = new URLSearchParams();

    // Prefer viewId passed from Results page (already correct for that diagnosis + age/module)
    if (viewId !== undefined && viewId !== null && viewId !== "") {
      const v = Number(Array.isArray(viewId) ? viewId[0] : viewId);
      if (Number.isFinite(v)) qs.set("viewId", String(v));
    }

    // Request HTML sections (your detail page renders section.body as HTML)
    qs.set("textFormat", "html");

    // findingIds may be a string or an array (Next.js router/query behavior)
    if (findingIds) {
      const arr = Array.isArray(findingIds) ? findingIds : [findingIds];
      arr.forEach((x) => {
        if (x === undefined || x === null || x === "") return;
        const n = Number(x);
        if (Number.isFinite(n)) qs.append("findingIds", String(n));
      });
    }

    const apiUrl = `${config.API_BASE_URL}/libraries/${audience}/diagnoses/${id}${
        qs.toString() ? `?${qs.toString()}` : ""
    }`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
          `Diagnosis detail fetch failed: ${response.status} ${errorText}`
      );
      return res.status(response.status).json({
        error: "Failed to fetch diagnosis detail",
        details: errorText,
      });
    }

    const results = await response.json();

    // Map image IDs for client-side loading through our proxy
    if (results.data?.images?.length) {
      results.data.images = results.data.images.map((img) => ({
        ...img,
        id: img.id, // Keep ID for signed URL generation
      }));
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in diagnosis detail API route:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
