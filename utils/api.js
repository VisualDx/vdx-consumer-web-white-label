import config from "@/config";

/**
 * Get API URL with proper base path
 * @param {string} path - The API endpoint path
 * @returns {string} The full API URL
 */
export function getApiUrl(path) {
  return `${config.API_BASE_URL}${path}`;
}

/**
 * Get the audience for API requests
 * @returns {Promise<string>} The audience value (consumer or clinical)
 */
export async function getAudience() {
  return config.AUDIENCE;
}

/**
 * Finding interface
 * @typedef {Object} Finding
 * @property {number} id - Finding ID
 * @property {string} name - Finding name
 */

/**
 * Age item interface
 * @typedef {Object} AgeItem
 * @property {number} value - Age value
 * @property {string} unit - Age unit (years, months, etc.)
 */

/**
 * Diagnosis interface
 * @typedef {Object} Diagnosis
 * @property {number} id - Diagnosis ID
 * @property {string} name - Diagnosis name
 * @property {string} severity - Severity level
 * @property {number} matchStrength - Match strength percentage
 * @property {Array<{id: number, imageUrl: string}>} images - Array of diagnosis images
 * @property {number} commonality - Commonality score
 */

/**
 * Fetch diagnosis results (differential) via Next.js API route
 * Token is fetched server-side by the API route for security
 * 
 * @param {Finding[]} findings - Array of findings to search for
 * @param {string | null} sex - Patient sex (M/F)
 * @param {AgeItem | null} age - Patient age object with value and unit
 * @param {boolean} required - Whether to mark findings as required
 * @param {boolean} itch - Does it itch?
 * @param {boolean} fever - Do you have a fever?
 * @param {number | null} onsetId - Timing/onset ID
 * @returns {Promise<Diagnosis[]>} Array of diagnosis results
 */
export async function fetchDiagnosisResults(findings, sex = null, age = null, required = false, itch = false, fever = false, onsetId = null) {
  if (findings.length === 0) return [];

  // Call Next.js API route - it will handle token fetching server-side
  const response = await fetch("/api/differential", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-key": process.env.NEXT_PUBLIC_APP_KEY || "",
    },
    body: JSON.stringify({
      findings,
      sex,
      age,
      itch,
      fever,
      onsetId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch diagnosis results");
  }

  const result = await response.json();
  return result.data || [];
}
