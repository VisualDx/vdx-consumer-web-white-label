import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Results.module.css";
import { fetchDiagnosisResults } from "@/utils/api";
import { PATIENT_QUESTIONS } from "@/constants/visualdxOptions";
import AuthImage from "@/components/AuthImage/AuthImage";
import {sortImagesBySkinTone} from "@/utils/skinTone";

export default function Results() {
  const router = useRouter();
  const hasRestoredScroll = useRef(false);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackToSummary = () => {
    // Prefer browser back to preserve Summary state; fallback to direct navigation.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/summary");
  };

  useEffect(() => {
    // Get query parameters from the URL
    const { findings, sex, age, skinTone, itch, fever, onsetId } = router.query;

    if (!findings) {
      setError("No findings provided");
      setLoading(false);
      return;
    }

    // Parse findings array from query string
    let parsedFindings = [];
    try {
      parsedFindings = JSON.parse(findings);
    } catch (e) {
      setError("Invalid findings data");
      setLoading(false);
      return;
    }

    // Parse age if provided
    let ageParam = null;
    if (age) {
      try {
        ageParam = JSON.parse(age);
      } catch (e) {
        console.warn("Invalid age data:", e);
      }
    }

    // Parse boolean parameters
    const itchParam = itch === "true" || itch === true;
    const feverParam = fever === "true" || fever === true;
    const onsetIdParam = onsetId ? parseInt(onsetId) : null;

    // Fetch differential diagnosis from API
    // When building a differential, treat the number of findings (or widespread distribution) as required
    const fetchData = async () => {
      try {
        setLoading(true);

        const results = await fetchDiagnosisResults(
            parsedFindings,
            sex || null,
            ageParam,
            true, // Mark findings as required
            itchParam,
            feverParam,
            onsetIdParam
        );

        // Apply client-side skin tone filtering (light/dark -> skinType 1–6)
        // so the displayed images match the user's selected skin tone bucket.
        // const filteredResults = applySkinToneFilterToResults(results, skinTone);
        const sortedResults = (Array.isArray(results) ? results : []).map((dx) => ({
          ...dx,
          images: sortImagesBySkinTone(dx?.images, skinTone),
        }));
        //setDiagnoses(filteredResults);
        setDiagnoses(sortedResults);
        setError(null);
      } catch (err) {
        console.error("Error fetching diagnosis results:", err);
        setError(err.message || "Failed to fetch diagnosis results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router.query]);

  // Restore scroll position when coming back from detail page
  useEffect(() => {
    if (!loading && !hasRestoredScroll.current && typeof window !== "undefined") {
      const savedPosition = sessionStorage.getItem("resultsScrollPosition");
      if (savedPosition) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          sessionStorage.removeItem("resultsScrollPosition");
          hasRestoredScroll.current = true;
        }, 0);
      }
    }
  }, [loading]);

  /**
   * Handle clicking on a diagnosis to view its details
   * - Prefer viewId from results item (no need to recompute from age)
   * - Pass findingIds for consistent image ordering
   */
  const handleDiagnosisClick = (diagnosis) => {
    // Save current scroll position
    if (typeof window !== "undefined") {
      sessionStorage.setItem("resultsScrollPosition", window.scrollY.toString());
    }

    const { skinTone, findings, itch, fever, onsetId } = router.query;

    // Build findingIds from the same context used to generate results
    const mergedFindingIds = new Set();

    if (findings) {
      try {
        const parsed = JSON.parse(findings);
        if (Array.isArray(parsed)) {
          parsed
              .map((f) => Number(f?.id))
              .filter((x) => Number.isFinite(x))
              .forEach((x) => mergedFindingIds.add(x));
        }
      } catch (e) {
        // ignore
      }
    }

    // include patient questions if selected
    if (itch === "true" || itch === true) mergedFindingIds.add(PATIENT_QUESTIONS.itch.id);
    if (fever === "true" || fever === true) mergedFindingIds.add(PATIENT_QUESTIONS.fever.id);

    // include onsetId (if it is a findingId)
    if (onsetId !== undefined && onsetId !== null && onsetId !== "") {
      const onsetNum = Number(onsetId);
      if (Number.isFinite(onsetNum)) mergedFindingIds.add(onsetNum);
    }

    const findingIdsArray = Array.from(mergedFindingIds).map(String);
    const hasImages = Array.isArray(diagnosis?.images) && diagnosis.images.length > 0;
    const imgCtx = hasImages ? "li" : "ln"; // list-image | list-none

    // Navigate to diagnosis details page
    router.push({
      pathname: `/diagnosis/${diagnosis.id}`,
      query: {
        ...(skinTone ? { skinTone } : {}),
        ...(diagnosis.viewId ? { viewId: String(diagnosis.viewId) } : {}),
        ...(findingIdsArray.length ? { findingIds: findingIdsArray } : {}),
        imgCtx,
      },
    });
  };

  // Loading state
  if (loading) {
    return (
        <div className={styles.page}>
          <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
              <button
                  className={styles.backButton}
                  onClick={handleBackToSummary}
                  aria-label="Back"
              >
                <span className={styles.backIcon}>‹</span>
              </button>
              <h1 className={styles.title}>Possible Conditions</h1>
            </div>

            <div className={styles.loadingMessage}>
              Loading possible conditions...
            </div>
          </div>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className={styles.page}>
          <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
              <button
                  className={styles.backButton}
                  onClick={handleBackToSummary}
                  aria-label="Back"
              >
                <span className={styles.backIcon}>‹</span>
              </button>
              <h1 className={styles.title}>Possible Conditions</h1>
            </div>

            <div className={styles.errorMessage}>{error}</div>
            <div className={styles.ctaWrap}>
              <button
                  className={styles.errorBackButton}
                  onClick={handleBackToSummary}
              >
                Back to Summary
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className={styles.page}>
        <div className={styles.card}>
          {/* Header with Back Button */}
          <div className={styles.header}>
            <button
                className={styles.backButton}
                onClick={handleBackToSummary}
                aria-label="Back"
            >
              <span className={styles.backIcon}>‹</span>
            </button>
            <h1 className={styles.title}>Possible Conditions</h1>
          </div>

          {/* Results List */}
          {diagnoses.length === 0 ? (
              <div className={styles.noResults}>
                No matching conditions found. Please try adjusting your search
                criteria.
              </div>
          ) : (
              <div className={styles.resultsList}>
                {diagnoses.map((diagnosis) => (
                    <div
                        key={diagnosis.id}
                        className={styles.diagnosisCard}
                        onClick={() => handleDiagnosisClick(diagnosis)}
                    >
                      {/* Diagnosis Image - Full width on top */}
                      <div className={styles.imageWrapper}>
                        {diagnosis.images && diagnosis.images.length > 0 ? (
                            <AuthImage
                                imageId={diagnosis.images[0].id}
                                alt={diagnosis.name}
                                size="thumbnail"
                                className={styles.diagnosisImage}
                            />
                        ) : (
                            <div className={styles.noImage}>No image available</div>
                        )}
                      </div>

                      {/* Diagnosis Info - Bottom caption */}
                      <div className={styles.diagnosisInfo}>
                        <h3 className={styles.diagnosisName}>{diagnosis.name}</h3>

                        {/* Image Count */}
                        {diagnosis.images && diagnosis.images.length > 0 && (
                            <div className={styles.imageCount}>
                              {diagnosis.images.length}{" "}
                              {diagnosis.images.length === 1 ? "image" : "images"}
                            </div>
                        )}
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}
