import { useEffect, useMemo, useState } from "react";
import styles from "./LesionSelectionModal.module.css";
import AnswerCard from "./AnswerCard";
import FindingsList from "./FindingsList";
import lesionHierarchy from "@/public/lesion_hierarchy.json";

export default function LesionSelectionModal({ open, onClose, onSelected }) {
    const root = useMemo(() => lesionHierarchy, []);
    const [path, setPath] = useState([root]);
    const [current, setCurrent] = useState(root);

    // Match production: show "Type" (facet) derived from question path
    const getFacet = (node) => {
        const p = node?.path;
        if (!p) return "";
        const parts = p.split(">").map((s) => s.trim()).filter(Boolean);
        const last = parts[parts.length - 1] || "";
        return last.replace(/\?$/, "");
    };

    const facet = useMemo(
        () => current?.facet || getFacet(current) || getFacet(path?.[0]),
        [current, path]
    );

    useEffect(() => {
        if (!open) return;
        setPath([root]);
        setCurrent(root);
    }, [open, root]);

    if (!open) return null;

    const isFirstStep = path.length <= 1;

    const handleBack = () => {
        if (isFirstStep) {
            onClose?.();
            return;
        }
        const newPath = path.slice(0, -1);
        setPath(newPath);
        setCurrent(newPath[newPath.length - 1]);
    };

    const handleAnswer = (answer) => {
        if (answer?.question) {
            const next = answer.question;
            const newPath = [...path, next];
            setPath(newPath);
            setCurrent(next);
            return;
        }

        if (Array.isArray(answer?.findings) && answer.findings.length) {
            // Match production: big title becomes selected answer prompt
            const next = {
                title: answer?.prompt || answer?.name || current?.title,
                subtitle: current?.subtitle,
                facet: getFacet(current),
                findings: answer.findings,
            };
            const newPath = [...path, next];
            setPath(newPath);
            setCurrent(next);
        }
    };

    const handleSelectFinding = (finding) => {
        onSelected?.({
            id: finding.findingId,
            name: finding.name,
            icon: finding.icon,
            description: finding.description,
        });
        onClose?.();
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header shows Type (facet) like production */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
                            <span className={styles.icon} aria-hidden="true">‹</span>
                        </button>
                        <span className={styles.facet}>{facet}</span>
                    </div>

                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {/* Big title in body */}
                    {current?.title && <div className={styles.prompt}>{current.title}</div>}
                    {current?.subtitle && <div className={styles.subtitle}>{current.subtitle}</div>}

                    {Array.isArray(current?.findings) ? (
                        <FindingsList findings={current.findings} onSelect={handleSelectFinding} />
                    ) : (
                        <div className={styles.answersGrid}>
                            {(current?.answers || []).map((a) => (
                                <AnswerCard
                                    key={a.id || a.prompt || a.name}
                                    label={a.prompt ?? a.name ?? ""}
                                    icon={a.icon}
                                    onClick={() => handleAnswer(a)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
