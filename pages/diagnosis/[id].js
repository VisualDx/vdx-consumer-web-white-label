import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/DiagnosisDetail.module.css";
import AuthImage from "@/components/AuthImage/AuthImage";
import { sortImagesBySkinTone } from "@/utils/skinTone";

export default function DiagnosisDetail() {
  const router = useRouter();
  const { id, skinTone, viewId, findingIds, imgCtx } = router.query;

  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) return;

    async function fetchDiagnosisDetail() {
      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams();

        // Prefer viewId passed from Results page
        if (viewId) qs.set("viewId", String(viewId));

        // findingIds may be string or array (Next.js router.query)
        if (findingIds) {
          const arr = Array.isArray(findingIds) ? findingIds : [findingIds];
          arr.forEach((x) => {
            if (x !== undefined && x !== null && x !== "") {
              qs.append("findingIds", String(x));
            }
          });
        }

        const url = qs.toString()
            ? `/api/diagnosis/${id}?${qs.toString()}`
            : `/api/diagnosis/${id}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-app-key": process.env.NEXT_PUBLIC_APP_KEY || "",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch diagnosis detail");
        }

        const result = await response.json();
        setDiagnosis(result.data);
      } catch (err) {
        console.error("Error fetching diagnosis detail:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnosisDetail();
  }, [router.isReady, id, viewId, JSON.stringify(findingIds)]);

  /**
   * imgCtx:
   *  - "li": list-image (list said it has images)
   *  - "ln": list-none  (list said it has no images) => hide images in detail to match list
   *  - undefined: direct open detail => allow images
   */
  const allowImagesFromList = imgCtx !== "ln";

  // Final images to display in detail: hide if list said "no images", else sort by skinTone
  const displayImages = useMemo(() => {
    if (!allowImagesFromList) return [];
    return sortImagesBySkinTone(diagnosis?.images, skinTone);
  }, [allowImagesFromList, diagnosis?.images, skinTone]);

  // Reset index when id/skinTone changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id, skinTone, imgCtx]);

  // Keep index in range after displayImages changes
  useEffect(() => {
    if (currentImageIndex > Math.max(displayImages.length - 1, 0)) {
      setCurrentImageIndex(0);
    }
  }, [displayImages.length, currentImageIndex]);

  const handleBack = () => {
    router.back();
  };

  const handleNextImage = () => {
    if (displayImages && currentImageIndex < displayImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) {
    return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.header}>
              <button
                  className={styles.backButton}
                  onClick={handleBack}
                  aria-label="Back"
              >
                <span className={styles.backIcon}>‹</span>
              </button>
              <h1 className={styles.title}>Loading...</h1>
            </div>

            <div className={styles.loadingMessage}>
              Loading diagnosis details...
            </div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.header}>
              <button
                  className={styles.backButton}
                  onClick={handleBack}
                  aria-label="Back"
              >
                <span className={styles.backIcon}>‹</span>
              </button>
              <h1 className={styles.title}>Error</h1>
            </div>

            <div className={styles.errorMessage}>{error}</div>
            <div className={styles.ctaWrap}>
              <button className={styles.errorBackButton} onClick={handleBack}>
                Go Back
              </button>
            </div>
          </div>
        </div>
    );
  }

  if (!diagnosis) {
    return (
        <div className={styles.page}>
          <div className={styles.card}>
            <div className={styles.header}>
              <button
                  className={styles.backButton}
                  onClick={handleBack}
                  aria-label="Back"
              >
                <span className={styles.backIcon}>‹</span>
              </button>
              <h1 className={styles.title}>Not Found</h1>
            </div>

            <div className={styles.errorMessage}>Diagnosis not found</div>
          </div>
        </div>
    );
  }

  return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <button
                className={styles.backButton}
                onClick={handleBack}
                aria-label="Back"
            >
              <span className={styles.backIcon}>‹</span>
            </button>
            <h1 className={styles.title}>{diagnosis.name || "Diagnosis"}</h1>
          </div>

          <div className={styles.content}>
            {/* Image Carousel */}
            {displayImages && displayImages.length > 0 && (
                <div className={styles.carouselContainer}>
                  {/* Navigation Buttons - Desktop Only */}
                  {displayImages.length > 1 && (
                      <>
                        {currentImageIndex > 0 && (
                            <button
                                className={`${styles.carouselNavButton} ${styles.carouselNavPrev}`}
                                onClick={handlePrevImage}
                                aria-label="Previous image"
                            >
                              <span className={styles.carouselNavIcon}>‹</span>
                            </button>
                        )}
                        {currentImageIndex < displayImages.length - 1 && (
                            <button
                                className={`${styles.carouselNavButton} ${styles.carouselNavNext}`}
                                onClick={handleNextImage}
                                aria-label="Next image"
                            >
                              <span className={styles.carouselNavIcon}>›</span>
                            </button>
                        )}
                      </>
                  )}

                  <div
                      className={styles.carousel}
                      style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                      }}
                  >
                    {displayImages.map((image, index) => (
                        <div key={image.id || index} className={styles.carouselItem}>
                          <AuthImage
                              imageId={image.id}
                              alt={`${diagnosis.name} - Image ${index + 1}`}
                              size="large"
                              className={styles.carouselImage}
                          />
                          {image.caption && (
                              <p className={styles.imageCaption}>{image.caption}</p>
                          )}
                        </div>
                    ))}
                  </div>

                  {/* Image Counter */}
                  {displayImages.length > 1 && (
                      <div className={styles.imageCounter}>
                        {currentImageIndex + 1} / {displayImages.length}
                      </div>
                  )}
                </div>
            )}

            {/* Text Sections */}
            <div className={styles.sections}>
              {diagnosis.sections && diagnosis.sections.length > 0 ? (
                  diagnosis.sections
                      .sort(
                          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
                      )
                      .map((section, index) => (
                          <div key={index} className={styles.section}>
                            {section.title && (
                                <h2 className={styles.sectionTitle}>{section.title}</h2>
                            )}
                            {section.body && (
                                <div
                                    className={styles.sectionContent}
                                    dangerouslySetInnerHTML={{ __html: section.body }}
                                />
                            )}
                          </div>
                      ))
              ) : (
                  <div className={styles.noContent}>
                    <p>No detailed information available for this diagnosis.</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
