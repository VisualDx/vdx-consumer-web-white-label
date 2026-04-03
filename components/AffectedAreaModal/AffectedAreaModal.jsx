import { useEffect } from "react";
import styles from "./AffectedAreaModal.module.css";
import InlineSvg from "@/components/InlineSvg/InlineSvg";

export default function AffectedAreaModal({ open, onClose, onSelectSingle, onSelectLimited, onSelectWidespread }) {
    // Close on ESC key
    useEffect(() => {
        if (!open) return;
        
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Affected Area</h2>
                    <button type="button" className={styles.close} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Options */}
                <div className={styles.options}>
                    {/* Single Lesion */}
                    <button type="button" className={styles.optionButton} onClick={onSelectSingle}>
                        <div className={styles.iconContainer}>
                            <img 
                                src="/images/bodies/distribution-single.svg" 
                                alt="Single Lesion" 
                                className={styles.bodyIcon}
                            />
                        </div>
                        <div className={styles.optionContent}>
                            <div className={styles.optionTitle}>Single Lesion or Growth</div>
                            <div className={styles.optionSubtitle}>A singular localized abnormality on the skin (ex. cyst, mole)</div>
                        </div>
                    </button>

                    {/* Limited Area */}
                    <button type="button" className={styles.optionButton} onClick={onSelectLimited}>
                        <div className={styles.iconContainer}>
                            <InlineSvg
                                src="/images/bodies/distribution-multiple.svg" 
                                alt="Limited Distribution" 
                                className={styles.bodyIcon}
                            />
                        </div>
                        <div className={styles.optionContent}>
                            <div className={styles.optionTitle}>Limited Distribution Rash</div>
                            <div className={styles.optionSubtitle}>A rash or skin abnormality affecting larger or multiple areas of skin (ex. hives, atopic dermatitis)</div>
                        </div>
                    </button>

                    {/* Widespread */}
                    <button type="button" className={styles.optionButton} onClick={onSelectWidespread}>
                        <div className={styles.iconContainer}>
                            <InlineSvg
                                src="/images/bodies/distribution-widespread.svg" 
                                alt="Widespread" 
                                className={styles.bodyIcon}
                            />
                        </div>
                        <div className={styles.optionContent}>
                            <div className={styles.optionTitle}>Widespread</div>
                            <div className={styles.optionSubtitle}>A rash or skin abnormality affecting most of the body</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
