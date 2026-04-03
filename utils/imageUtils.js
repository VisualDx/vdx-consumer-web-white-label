import { useState, useEffect } from "react";

/**
 * Generate signed image URL from server
 * Server generates signature to ensure consistency
 */
async function getSignedImageUrl(imageId, size = "thumbnail") {
  if (!imageId) return null;
  
  try {
    // Request signed URL from server
    const response = await fetch("/api/images/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageId, size }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate signed URL");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error getting signed image URL:", error);
    return null;
  }
}

/**
 * Custom hook to fetch authenticated images
 * Server generates signed URLs for security
 * @param {number} imageId - The image ID
 * @param {string} size - Image size (thumbnail, full, etc.)
 * @returns {Object} { imageUrl, loading, error }
 */
export function useAuthenticatedImage(imageId, size = "thumbnail") {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchSignedUrl() {
      try {
        setLoading(true);
        const url = await getSignedImageUrl(imageId, size);
        
        if (mounted) {
          if (url) {
            setImageUrl(url);
            setError(null);
          } else {
            setError("Failed to generate image URL");
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching signed URL:", err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchSignedUrl();

    return () => {
      mounted = false;
    };
  }, [imageId, size]);

  return { imageUrl, loading, error };
}

/**
 * Get authenticated image URL with security signature
 * Server generates signature for consistency
 * @param {number} imageId - The image ID
 * @param {string} size - Image size (thumbnail, full, etc.)
 * @returns {Promise<string>} The signed image URL
 */
export async function getAuthenticatedImageUrl(imageId, size = "thumbnail") {
  return await getSignedImageUrl(imageId, size);
}
