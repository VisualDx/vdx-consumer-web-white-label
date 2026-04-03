// pages/api/differential.js
import config from "@/config";
import {
  validateApiRequest,
  checkRateLimit,
  getClientIdentifier,
} from "@/middleware/auth";
import { getAuthToken } from "@/utils/tokenManager";
import { PATIENT_QUESTIONS } from "@/constants/visualdxOptions"; // ✅ add

export default async function handler(req, res) {
  const validation = validateApiRequest(req);
  if (!validation.valid) {
    return res.status(validation.code).json({ error: validation.error });
  }

  const clientId = getClientIdentifier(req);
  const rateCheck = checkRateLimit(clientId);
  if (!rateCheck.allowed) {
    return res.status(rateCheck.code).json({ error: rateCheck.error });
  }

  try {
    const { findings, sex, age, itch, fever, onsetId } = req.body;

    if (!findings || findings.length === 0) {
      return res.status(400).json({ error: "No findings provided" });
    }

    const token = await getAuthToken();
    const audience = config.AUDIENCE;
    const apiUrl = `${config.API_BASE_URL}/differentials/${audience}/workup`;

    // --- Build merged finding IDs (avoid duplicates) ---
    const mergedFindingIds = new Set(
        findings.map((f) => Number(f.id)).filter((x) => Number.isFinite(x))
    );

    if (itch === true) mergedFindingIds.add(PATIENT_QUESTIONS.itch.id);
    if (fever === true) mergedFindingIds.add(PATIENT_QUESTIONS.fever.id);
    if (onsetId !== undefined && onsetId !== null) mergedFindingIds.add(Number(onsetId));

    const requestBody = {
      findings: Array.from(mergedFindingIds).map((id) => ({
        id,
        //required: true,
      })),
    };

    if (sex) requestBody.sex = sex;

    if (age && age.unit && age.value !== undefined && age.value !== null) {
      requestBody.age = { value: age.value, unit: age.unit };
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Differential fetch failed: ${response.status} ${errorText}`);
      return res.status(response.status).json({
        error: "Failed to fetch differential",
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in differential API route:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
}
