import styles from "./LesionSelectionModal.module.css";

export default function AnswerCard({ label, icon, onClick }) {
    return (
        <button type="button" className={styles.answerCard} onClick={onClick}>
            <div className={styles.answerIconWrap}>
                {/* ✅ icon like old tool */}
                {icon ? (
                    <img className={styles.answerIcon} src={`/icons/${icon}.png?v=1`} alt="" />
                ) : (
                    <div className={styles.answerIconFallback} />
                )}
            </div>
            <div className={styles.answerLabel}>{label}</div>
        </button>
    );
}
