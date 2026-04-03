import styles from "./LesionSelectionModal.module.css";

export default function FindingsList({ findings, onSelect }) {
    return (
        <div className={styles.findingsWrap}>
            <div className={styles.findingsTitle}>Matching Lesions</div>

            <div className={styles.findingsScroll}>
                {findings.map((f) => (
                    <button
                        key={f.findingId}
                        type="button"
                        className={styles.findingRow}
                        onClick={() => onSelect?.(f)}
                    >
                        <img className={styles.findingRowIcon} src={`/icons/${f.icon}.png?v=1`} alt={f.name || ""} />
                        <div className={styles.findingInfo}>
                            <div className={styles.findingName}>{f.name}</div>
                            {f.description && <div className={styles.findingDesc}>{f.description}</div>}
                            {/*{f.findingId && <div className={styles.findingId}>ID: {f.findingId}</div>}*/}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
