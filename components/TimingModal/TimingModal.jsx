import styles from "./TimingModal.module.css";
import { PATIENT_QUESTIONS } from "@/constants/visualdxOptions";

export default function TimingModal({
                                      open,
                                      selectedId,
                                      onClose,
                                      onSelect,
                                      options, // ✅ NEW
                                    }) {
  if (!open) return null;

  // ✅ Use passed options (age-dependent). Fallback to existing constant if not provided.
  const onsetOptions = Array.isArray(options) && options.length > 0
      ? options
      : PATIENT_QUESTIONS.onset;

  return (
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          {/* Close */}
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>

          {/* Header */}
          <div className={styles.header}>
            How long have you had<br />
            this skin problem?
          </div>

          {/* Options */}
          <div className={styles.options}>
            {onsetOptions.map((option) => (
                <button
                    key={option.id}
                    className={`${styles.option} ${
                        selectedId === option.id ? styles.active : ""
                    }`}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                >
                  {option.label}
                </button>
            ))}
          </div>
        </div>
      </div>
  );
}
