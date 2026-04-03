import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./LesionSelectorModal.module.css";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 *
 * New (recommended):
 * - onLesionSelected?: (payload) => void
 *
 * Optional:
 * - onOpenLesionPicker?: () => void
 *
 * Legacy (optional):
 * - onTakePicture?: () => void
 * - onSelectLesion?: (payload?) => void
 */
export default function LesionSelectorModal({
                                              open,
                                              onClose,
                                              onTakePicture,
                                              onLesionSelected,
                                              onOpenLesionPicker,
                                              onSelectLesion,
                                            }) {
  const [view, setView] = useState("chooser"); // chooser | upload | picker
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Normalize name -> icon filename convention (kebab-case)
  // Example: "Cayenne pepper-like purpura" -> "cayenne-pepper-like-purpura"
  const resolveLesionIcon = useCallback((name) => {
    if (!name || typeof name !== "string") return null;
    return name
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
  }, []);

  useEffect(() => {
    if (!open) return;
    setView("chooser");
    setLoading(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startUpload = useCallback(() => {
    setError("");
    setLoading(false);
    setView("upload");
    resetFileInput();
  }, []);

  const openPicker = useCallback(() => {
    setError("");
    setLoading(false);
    setView("picker");

    if (typeof onOpenLesionPicker === "function") {
      onOpenLesionPicker();
      return;
    }
    if (typeof onSelectLesion === "function") {
      try {
        onSelectLesion();
      } catch (_) {}
    }
  }, [onOpenLesionPicker, onSelectLesion]);

  const backToChooser = useCallback(() => {
    if (loading) return;
    setError("");
    setView("chooser");
    resetFileInput();
  }, [loading]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose?.();
  }, [loading, onClose]);

  const emitSelected = useCallback(
      (payload) => {
        if (typeof onLesionSelected === "function") {
          onLesionSelected(payload);
          return;
        }
        if (typeof onSelectLesion === "function") {
          onSelectLesion(payload);
        }
      },
      [onLesionSelected, onSelectLesion]
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to analyze image");
        setLoading(false);
        resetFileInput();
        return;
      }

      const lesionName = data?.lesion?.name || data?.lesionName || "";
      const lesionId = data?.lesion?.id ?? null;

      // Keep payload consistent with Manual Selection Tool
      const payload = {
        id: lesionId,
        name: lesionName,
        icon: resolveLesionIcon(lesionName),
        description: null,
        confidence: data?.confidence ?? null,
        therapyMessage: data?.therapyMessage ?? null,
        from: "upload",
        raw: data,
      };

      emitSelected(payload);
      onClose?.();
    } catch (err) {
      setError("Failed to analyze image");
      setLoading(false);
      resetFileInput();
    }
  };

  if (!open) return null;

  const headerTitle = view === "upload" ? "Upload a skin photo" : "";

  return (
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          {/* Header: back (only on upload) + close (always) */}
          {view === "upload" && (
              <button
                  type="button"
                  className={styles.headerIconButton}
                  onClick={backToChooser}
                  aria-label="Back"
                  disabled={loading}
              >
            <span className={styles.headerIcon} aria-hidden="true">
              ‹
            </span>
              </button>
          )}

          <button
              type="button"
              className={`${styles.headerIconButton} ${styles.headerCloseButton}`}
              onClick={handleClose}
              aria-label="Close"
              disabled={loading}
          >
          <span className={styles.headerIcon} aria-hidden="true">
            ×
          </span>
          </button>

          {/* Center title only for upload view (as requested) */}
          {headerTitle ? <div className={styles.headerTitle}>{headerTitle}</div> : null}

          {/* ===== Chooser ===== */}
          {view === "chooser" && (
              <div className={styles.content}>
                {/* Take picture */}
                <div
                    className={styles.actionItem}
                    onClick={() => {
                      startUpload();
                      void onTakePicture;
                    }}
                >
                  <div className={styles.actionButton}>
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <div className={styles.actionLabel}>
                    Take a Skin<br />Picture
                  </div>
                </div>

                <div className={styles.or}>OR</div>

                {/* Select lesion (manual picker) */}
                <div className={styles.actionItem} onClick={openPicker}>
                  <div className={styles.actionButton}>
                    <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </div>
                  <div className={styles.actionLabel}>
                    Select a Skin<br />Lesion
                  </div>
                </div>
              </div>
          )}

          {/* ===== Upload ===== */}
          {view === "upload" && (
              <div className={styles.uploadWrap}>
                <label className={styles.uploadBox}>
                  <input
                      ref={fileInputRef}
                      className={styles.fileInput}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFileChange}
                      disabled={loading}
                  />
                  <div className={styles.uploadHint}>
                    {loading ? "Analyzing…" : "Choose a photo (.png/.jpg, max 10MB)"}
                  </div>
                </label>

                {loading && (
                    <div className={styles.loadingRow}>
                      <div className={styles.spinner} />
                      <div className={styles.loadingText}>Analyzing your image…</div>
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}
              </div>
          )}
        </div>
      </div>
  );
}
