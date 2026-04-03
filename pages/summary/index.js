import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Summary.module.css";

import { AGE_OPTIONS, SEX_OPTIONS, PATIENT_QUESTIONS } from "@/constants/visualdxOptions";

import TimingModal from "@/components/TimingModal/TimingModal";
import LesionSelectionModal from "@/components/LesionSelectionTool/LesionSelectionModal";
import LesionSelectorModal from "@/components/LesionSelectorModal/LesionSelectorModal";

import AffectedAreaModal from "@/components/AffectedAreaModal/AffectedAreaModal";
import BodyLocationPicker from "@/components/BodyLocationPicker/BodyLocationPicker";
import {
    buildAffectedAreaFindings,
    getAffectedAreaSummaryDisplay,
    getAffectedAreaSummaryText,
} from "@/components/AffectedAreaModal/affectedAreaFindings";
import {ageGroupIdToAgeItem} from "@/utils/age";

// ✅ Timing options confirmed by James
const NEONATAL_TIMING_OPTIONS = [
    { id: 24157, label: "Present at birth" },
    { id: 24158, label: "Developed during first days to week of life" },
    { id: 24160, label: "Developed after first week and during first month" },
    { id: 24159, label: "Developed after first newborn month during infancy" },
];

const OTHER_AGE_TIMING_OPTIONS = [
    { id: 24363, label: "Developed rapidly (minutes to hours)" },
    { id: 24364, label: "Developed acutely (days to weeks)" },
    { id: 24369, label: "Developed steadily (weeks to months)" },
    { id: 24365, label: "Chronic duration lasting years" },
    { id: 24366, label: "Recurring episodes or relapses" },
];

export default function Summary() {
    const router = useRouter();

    const SUMMARY_STATE_STORAGE_KEY = "vdx:summaryState:v1";
    const hasInitializedFromStorageRef = useRef(false);
    const skipNextAutoPersistRef = useRef(true);

    const [age, setAge] = useState(null);
    const [sex, setSex] = useState(null);
    const [onsetId, setOnsetId] = useState(null);

    const [itch, setItch] = useState(false);
    const [fever, setFever] = useState(false);

    const [skinTone, setSkinTone] = useState("light");
    const [ageOpen, setAgeOpen] = useState(false);
    const [sexOpen, setSexOpen] = useState(false);
    const [timingOpen, setTimingOpen] = useState(false);

    const [lesionModalOpen, setLesionModalOpen] = useState(false);
    const [lesionToolOpen, setLesionToolOpen] = useState(false);

    const [selectedLesion, setSelectedLesion] = useState(null);

    const [affectedAreaModalOpen, setAffectedAreaModalOpen] = useState(false);
    const [bodyLocationPickerOpen, setBodyLocationPickerOpen] = useState(false);
    const [coverageType, setCoverageType] = useState(null); // "single" | "limited" | "widespread" | null
    const [selectedLocations, setSelectedLocations] = useState([]); // Array<{id, name}>
    const shouldReset = router.query?.reset === "1";

    const readPersistedSummaryState = () => {
        if (typeof window === "undefined") return null;
        try {
            const rawSession = window.sessionStorage.getItem(SUMMARY_STATE_STORAGE_KEY);
            if (rawSession) return JSON.parse(rawSession);
        } catch {
            // ignore
        }
        try {
            const rawLocal = window.localStorage.getItem(SUMMARY_STATE_STORAGE_KEY);
            if (rawLocal) return JSON.parse(rawLocal);
        } catch {
            // ignore
        }
        return null;
    };

    const persistSummaryState = (payload) => {
        if (typeof window === "undefined") return;
        const raw = JSON.stringify(payload);
        try {
            window.sessionStorage.setItem(SUMMARY_STATE_STORAGE_KEY, raw);
            return;
        } catch {
            // ignore and fall back
        }
        try {
            window.localStorage.setItem(SUMMARY_STATE_STORAGE_KEY, raw);
        } catch {
            // ignore
        }
    };

    // Restore state when navigating back from Results.
    useEffect(() => {

        // ✅ If coming from Home → reset Summary state
        if (shouldReset) {
            try {
                sessionStorage.removeItem(SUMMARY_STATE_STORAGE_KEY);
                localStorage.removeItem(SUMMARY_STATE_STORAGE_KEY);
            } catch {}

            // Reset all local state
            setAge(null);
            setSex(null);
            setOnsetId(null);
            setItch(false);
            setFever(false);
            setSkinTone("light");
            setCoverageType(null);
            setSelectedLocations([]);
            setSelectedLesion(null);

            hasInitializedFromStorageRef.current = true;
            skipNextAutoPersistRef.current = true;
            router.replace("/summary", undefined, { shallow: true });
            return;
        }

        // 🔁 Normal restore flow (Results → Summary)
        try {
            const parsed = readPersistedSummaryState();
            if (!parsed || typeof parsed !== "object") return;

            if (parsed.age !== undefined) setAge(parsed.age);
            if (parsed.sex !== undefined) setSex(parsed.sex);
            if (parsed.onsetId !== undefined) setOnsetId(parsed.onsetId);
            if (parsed.itch !== undefined) setItch(Boolean(parsed.itch));
            if (parsed.fever !== undefined) setFever(Boolean(parsed.fever));
            if (parsed.skinTone !== undefined) setSkinTone(parsed.skinTone);
            if (parsed.coverageType !== undefined) setCoverageType(parsed.coverageType);
            if (Array.isArray(parsed.selectedLocations)) setSelectedLocations(parsed.selectedLocations);
            if (parsed.selectedLesion !== undefined) setSelectedLesion(parsed.selectedLesion);
        } catch {
            // Ignore invalid stored state
        } finally {
            hasInitializedFromStorageRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist state so Results -> Summary keeps selections.
    useEffect(() => {
        if (!hasInitializedFromStorageRef.current) return;
        if (skipNextAutoPersistRef.current) {
            skipNextAutoPersistRef.current = false;
            return;
        }
        try {
            persistSummaryState({
                age,
                sex,
                onsetId,
                itch,
                fever,
                skinTone,
                coverageType,
                selectedLocations,
                selectedLesion,
            });
        } catch {
            // Ignore storage failures (e.g., quota)
        }
    }, [age, sex, onsetId, itch, fever, skinTone, coverageType, selectedLocations, selectedLesion]);

    const canSubmit = age !== null && sex !== null && onsetId !== null;

    const AGE_GROUPED = useMemo(
        () => ({
            CHILD: AGE_OPTIONS.filter((o) => o.id <= 3),
            ADULT: AGE_OPTIONS.filter((o) => o.id >= 4),
        }),
        []
    );

    const selectedAgeLabel = AGE_OPTIONS.find((o) => o.id === age)?.label ?? "Select";
    const selectedSexLabel = SEX_OPTIONS.find((o) => o.id === sex)?.label ?? "Select";

    // ✅ Determine if selected age is Neonatal/Newborn
    const isNeonatalAge = useMemo(() => age === 0, [age]);

    // ✅ Timing options depend on age
    const timingOptions = useMemo(() => {
        return isNeonatalAge ? NEONATAL_TIMING_OPTIONS : OTHER_AGE_TIMING_OPTIONS;
    }, [isNeonatalAge]);

    // ✅ If age changes and current onsetId is not valid anymore, clear it
    useEffect(() => {
        if (age === null) return;
        if (onsetId === null) return;

        const stillValid = timingOptions.some((o) => o.id === onsetId);
        if (!stillValid) setOnsetId(null);
    }, [age, onsetId, timingOptions]);

    // ✅ Selected timing label must come from timingOptions (not PATIENT_QUESTIONS.onset)
    const selectedTimingLabel = timingOptions.find((o) => o.id === onsetId)?.label ?? "Select";

    const applySelectedLesion = (lesion) => {
        if (!lesion?.name) return;
        setSelectedLesion({
            id: lesion.id ?? null,
            name: lesion.name,
            icon: lesion.icon ?? null,
        });
    };

    const openBodyLocationPickerFor = (nextCoverageType) => {
        // ✅ Fix: when switching between "single" and "limited",
        // clear previous selections to prevent stale findings.
        setSelectedLocations((prev) => {
            if (coverageType !== nextCoverageType) return [];

            // Extra safety: single mode should never carry multiple selections
            if (nextCoverageType === "single" && Array.isArray(prev) && prev.length > 1) {
                return prev.slice(0, 1);
            }

            return prev;
        });

        setCoverageType(nextCoverageType);
        setAffectedAreaModalOpen(false);
        setBodyLocationPickerOpen(true);
    };

    const handleSelectSingle = () => {
        openBodyLocationPickerFor("single");
    };

    const handleSelectLimited = () => {
        openBodyLocationPickerFor("limited");
    };

    const handleSelectWidespread = () => {
        setCoverageType("widespread");
        setSelectedLocations([]);
        setAffectedAreaModalOpen(false);
    };

    const handleLocationsDone = (locations) => {
        const safeLocations = Array.isArray(locations) ? locations : [];

        setSelectedLocations(coverageType === "single" ? safeLocations.slice(0, 1) : safeLocations);
        setBodyLocationPickerOpen(false);
    };

    const affectedAreaText = getAffectedAreaSummaryText({ coverageType, selectedLocations });
    const affectedAreaDisplay = getAffectedAreaSummaryDisplay({ coverageType, selectedLocations });

    // Navigate to results page with current selections
    const handleSubmit = () => {
        if (!canSubmit) return;

        persistSummaryState({
            age,
            sex,
            onsetId,
            itch,
            fever,
            skinTone,
            coverageType,
            selectedLocations,
            selectedLesion,
        });

        const findings = [];
        const seenFindingIds = new Set();

        const addFinding = (id, name) => {
            const numericId = Number(id);
            if (!Number.isFinite(numericId)) return;
            if (seenFindingIds.has(numericId)) return;
            seenFindingIds.add(numericId);
            findings.push({ id: numericId, name });
        };

        if (selectedLesion?.id !== undefined && selectedLesion?.id !== null) {
            addFinding(selectedLesion.id, selectedLesion.name);
        }

        buildAffectedAreaFindings({ coverageType, selectedLocations }).forEach((f) =>
            addFinding(f.id, f.name)
        );

        router.push({
            pathname: "/results",
            query: {
                findings: JSON.stringify(findings),
                sex,
                age: JSON.stringify(ageGroupIdToAgeItem(age)),
                skinTone,
                itch,
                fever,
                onsetId,
            },
        });
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.logoWrap}>
                    <Image src="/images/visualdx-logo.png" alt="VisualDx" width={180} height={50} />
                </div>

                {/* AGE + SEX */}
                <div className={styles.section}>
                    <div className={styles.row}>
                        <div className={styles.col}>
                            <div className={styles.label}>AGE GROUP</div>
                            <div className={styles.dropdownWrapper}>
                                <div
                                    className={styles.selectRow}
                                    onClick={() => {
                                        setAgeOpen((v) => !v);
                                        setSexOpen(false);
                                        setTimingOpen(false);
                                    }}
                                >
                                    <span>{selectedAgeLabel}</span>
                                    <span className={styles.caret}>▼</span>
                                </div>

                                {ageOpen && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownGroup}>
                                            <div className={styles.dropdownHeader}>CHILD</div>
                                            {AGE_GROUPED.CHILD.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setAge(opt.id);
                                                        setAgeOpen(false);
                                                    }}
                                                >
                                                    {opt.label}
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.dropdownGroup}>
                                            <div className={styles.dropdownHeader}>ADULT</div>
                                            {AGE_GROUPED.ADULT.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setAge(opt.id);
                                                        setAgeOpen(false);
                                                    }}
                                                >
                                                    {opt.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.col}>
                            <div className={styles.label}>SEX</div>
                            <div className={styles.dropdownWrapper}>
                                <div
                                    className={styles.selectRow}
                                    onClick={() => {
                                        setSexOpen((v) => !v);
                                        setAgeOpen(false);
                                        setTimingOpen(false);
                                    }}
                                >
                                    <span>{selectedSexLabel}</span>
                                    <span className={styles.caret}>▼</span>
                                </div>

                                {sexOpen && (
                                    <div className={styles.dropdown}>
                                        {SEX_OPTIONS.map((opt) => (
                                            <div
                                                key={opt.id}
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    setSex(opt.id);
                                                    setSexOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SKIN TONE */}
                <div className={styles.section}>
                    <div className={styles.label}>SKIN TONE</div>
                    <div className={styles.toggle}>
                        <button
                            className={`${styles.toggleButton} ${skinTone === "light" ? styles.active : ""}`}
                            onClick={() => setSkinTone("light")}
                        >
                            Light Skin
                        </button>
                        <button
                            className={`${styles.toggleButton} ${skinTone === "dark" ? styles.active : ""}`}
                            onClick={() => setSkinTone("dark")}
                        >
                            Dark Skin
                        </button>
                    </div>
                </div>

                {/* AFFECTED AREA */}
                <div className={styles.section}>
                    <div className={styles.label}>AFFECTED AREA</div>

                    {affectedAreaDisplay ? (
                        <div className={styles.splitRow}>
                            <button
                                className={styles.valueCard}
                                type="button"
                                onClick={() => setAffectedAreaModalOpen(true)}
                            >
                                <div className={styles.valueText}>
                                    <div className={styles.valueTitle}>{affectedAreaDisplay.title}</div>
                                    {affectedAreaDisplay.sub ? (
                                        <div className={styles.valueSub}>{affectedAreaDisplay.sub}</div>
                                    ) : null}
                                </div>
                            </button>
                            <button
                                className={styles.editButton}
                                type="button"
                                onClick={() => setAffectedAreaModalOpen(true)}
                            >
                                Edit
                            </button>
                        </div>
                    ) : (
                        <div className={styles.selectRow} onClick={() => setAffectedAreaModalOpen(true)}>
                            <span>{affectedAreaText}</span>
                            <div className={styles.plus}>+</div>
                        </div>
                    )}
                </div>

                {/* SKIN APPEARANCE */}
                <div className={styles.section}>
                    <div className={styles.label}>SKIN APPEARANCE</div>

                    {selectedLesion ? (
                        <div className={styles.splitRow}>
                            <button
                                className={styles.valueCardWithThumb}
                                type="button"
                                onClick={() => setLesionModalOpen(true)}
                            >
                                <div className={styles.valueText}>
                                    <div className={styles.valueTitle}>{selectedLesion.name}</div>
                                </div>
                                {selectedLesion.icon && (
                                    <img className={styles.valueThumb} src={`/icons/${selectedLesion.icon}.png`} alt="" />
                                )}
                            </button>
                            <button
                                className={styles.editButton}
                                type="button"
                                onClick={() => setLesionModalOpen(true)}
                            >
                                Edit
                            </button>
                        </div>
                    ) : (
                        <div className={styles.selectRow} onClick={() => setLesionModalOpen(true)}>
                            <span>Select</span>
                            <div className={styles.plus}>+</div>
                        </div>
                    )}
                </div>

                {/* TIMING */}
                <div className={styles.section}>
                    <div className={styles.label}>TIMING</div>

                    {onsetId ? (
                        <div className={styles.splitRow}>
                            <button type="button" className={styles.valueCard} onClick={() => setTimingOpen(true)}>
                                <div className={styles.valueText}>
                                    <div className={`${styles.valueTitle} ${styles.wrapTitle}`}>{selectedTimingLabel}</div>
                                </div>
                            </button>

                            <button type="button" className={styles.editButton} onClick={() => setTimingOpen(true)}>
                                Edit
                            </button>
                        </div>
                    ) : (
                        <div className={styles.selectRow} onClick={() => setTimingOpen(true)}>
                            <span>Select</span>
                            <div className={styles.plus}>+</div>
                        </div>
                    )}
                </div>

                {/* OTHER SYMPTOMS */}
                <div className={styles.section}>
                    <div className={styles.label}>OTHER SYMPTOMS</div>
                    <div className={styles.checkboxRow}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={itch}
                                onChange={(e) => setItch(e.target.checked)}
                            />
                            <span className={styles.customCheckbox}/>
                            <span className={styles.checkboxText}>{PATIENT_QUESTIONS.itch.label}</span>
                        </label>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={fever}
                                onChange={(e) => setFever(e.target.checked)}
                            />
                            <span className={styles.customCheckbox}/>
                            <span className={styles.checkboxText}>{PATIENT_QUESTIONS.fever.label}</span>
                        </label>
                    </div>
                </div>

                {/* CTA */}
                <div className={styles.ctaWrap}>
                    <button
                        className={`${styles.cta} ${canSubmit ? styles.ctaEnabled : styles.ctaDisabled}`}
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        Show Possible Conditions
                    </button>
                </div>
            </div>

            {/* MODALS */}
            <LesionSelectorModal
                open={lesionModalOpen}
                onClose={() => setLesionModalOpen(false)}
                onLesionSelected={(lesion) => {
                    applySelectedLesion(lesion);
                    setLesionModalOpen(false);
                }}
                onOpenLesionPicker={() => {
                    setLesionModalOpen(false);
                    setLesionToolOpen(true);
                }}
            />

            <LesionSelectionModal
                open={lesionToolOpen}
                onClose={() => setLesionToolOpen(false)}
                onSelected={(lesion) => {
                    applySelectedLesion(lesion);
                    setLesionToolOpen(false);
                }}
            />

            <TimingModal
                open={timingOpen}
                selectedId={onsetId}
                options={timingOptions}
                onClose={() => setTimingOpen(false)}
                onSelect={setOnsetId}
            />

            <AffectedAreaModal
                open={affectedAreaModalOpen}
                onClose={() => setAffectedAreaModalOpen(false)}
                onSelectSingle={handleSelectSingle}
                onSelectLimited={handleSelectLimited}
                onSelectWidespread={handleSelectWidespread}
            />

            <BodyLocationPicker
                open={bodyLocationPickerOpen}
                onClose={() => setBodyLocationPickerOpen(false)}
                onBack={() => {
                    setBodyLocationPickerOpen(false);
                    setAffectedAreaModalOpen(true);
                }}
                onDone={handleLocationsDone}
                coverageType={coverageType}
                initialSelections={selectedLocations}
            />
        </div>
    );
}
