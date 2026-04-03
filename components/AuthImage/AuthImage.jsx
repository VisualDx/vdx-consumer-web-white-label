import { useAuthenticatedImage } from "@/utils/imageUtils";
import styles from "./AuthImage.module.css";

/**
 * Component to display authenticated images from VisualDx API
 * @param {Object} props
 * @param {number} props.imageId - The image ID
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.size - Image size (thumbnail, full, etc.)
 * @param {string} props.className - Additional CSS class
 */
export default function AuthImage({ imageId, alt = "", size = "thumbnail", className = "" }) {
  const { imageUrl, loading, error } = useAuthenticatedImage(imageId, size);

  if (loading) {
    return (
      <div className={`${styles.placeholder} ${className}`}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.placeholder} ${styles.error} ${className}`}>
        <span className={styles.errorIcon}>⚠️</span>
        <span className={styles.errorText}>Failed to load image</span>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${styles.placeholder} ${className}`}>
        <span>No image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
