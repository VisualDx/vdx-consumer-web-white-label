import {useState, useEffect, useRef, useCallback, useMemo} from "react";
import styles from "./BodyLocationPicker.module.css";
import InlineSvg from "@/components/InlineSvg/InlineSvg";

// Top-level body locations for KAMINO-772
const TOP_LEVEL_LOCATIONS = [
    {id: 1202, name: "Scalp", svgIds: ["UA-scalp", "UA-scalp--back"]},
    {id: 1203, name: "Face", svgIds: ["UA-face"]},
    {id: 1213, name: "Neck", svgIds: ["UA-neck", "UA-neck--back"]},
    {
        id: 23536,
        name: "Shoulder",
        svgIds: ["UA-arm-upper-left", "UA-arm-upper-right", "UA-arm-upper-left--back", "UA-arm-upper-right--back"],
    },
    {id: 1226, name: "Trunk", svgIds: ["UA-chest", "UA-stomach", "UA-back"]},
    {
        id: 1216,
        name: "Arm",
        svgIds: [
            "UA-arm-lower-left",
            "UA-arm-lower-right",
            "UA-arm-upper-left",
            "UA-arm-upper-right",
            "UA-arm-lower-left--back",
            "UA-arm-lower-right--back",
            "UA-arm-upper-left--back",
            "UA-arm-upper-right--back",
            "UA-armpit-left",
            "UA-armpit-right",
            "UA-armpit-left--back",
            "UA-armpit-right--back",
            "UA-elbow-left",
            "UA-elbow-right",
            "UA-elbow-pit-left",
            "UA-elbow-pit-right",
        ],
    },
    {id: 1220, name: "Hands", svgIds: ["UA-hand-left", "UA-hand-right", "UA-hand-left--back", "UA-hand-right--back"]},
    {
        id: 1223,
        name: "Fingernails",
        svgIds: ["UA-hand-left", "UA-hand-right", "UA-hand-left--back", "UA-hand-right--back"]
    },
    {id: 24430, name: "Anogenital", svgIds: ["UA-genital", "UA-groin-left", "UA-groin-right", "UA-buttocks"]},
    {
        id: 1244,
        name: "Leg",
        svgIds: [
            "UA-leg-lower-left",
            "UA-leg-lower-right",
            "UA-leg-upper-left",
            "UA-leg-upper-right",
            "UA-leg-lower-left--back",
            "UA-leg-lower-right--back",
            "UA-leg-upper-left--back",
            "UA-leg-upper-right--back",
            "UA-knee-left",
            "UA-knee-right",
            "UA-knee-pit-left",
            "UA-knee-pit-right",
        ],
    },
    {
        id: 1250,
        name: "Foot or toes",
        svgIds: ["UA-foot-left", "UA-foot-right", "UA-foot-left--back", "UA-foot-right--back"]
    },
    {
        id: 1255,
        name: "Toenails",
        svgIds: ["UA-foot-left", "UA-foot-right", "UA-foot-left--back", "UA-foot-right--back"]
    },
];

/**
 * BodyLocationPicker
 *
 * Uses InlineSvg (Turbopack-friendly) and delegates click handling to the SVG container
 * so selections still work even though SVG markup is injected asynchronously.
 */
export default function BodyLocationPicker({open, onClose, onBack, onDone, coverageType, initialSelections = []}) {
    const [selectedLocations, setSelectedLocations] = useState(initialSelections);
    const [facingFront, setFacingFront] = useState(true);
    const [mapView, setMapView] = useState("body"); // "body" | "faceDetail"
    const [svgReadyTick, setSvgReadyTick] = useState(0); // retrigger highlight when SVG changes

    const svgContainerRef = useRef(null);
    const lastClickRef = useRef({uaId: null, ts: 0});
    const clickCoordsRef = useRef({x: 0, y: 0}); // Store click coordinates for dot positioning

    const isSingleMode = coverageType === "single";

    useEffect(() => {
        if (!open) return;
        // Reset click coords when opening so restored selections don't reuse stale coordinates.
        clickCoordsRef.current = {x: 0, y: 0};
    }, [open]);
    const canSubmit = selectedLocations.length > 0;

    const displayedLocations = useMemo(() => {
        const byId = new Map();
        (selectedLocations ?? []).forEach((loc) => {
            const id = Number(loc?.id);
            if (!Number.isFinite(id)) return;
            if (!byId.has(id)) byId.set(id, loc);
        });
        return Array.from(byId.values());
    }, [selectedLocations]);

    const extractUaId = useCallback((rawId) => {
        if (!rawId || typeof rawId !== "string") return null;
        const start = rawId.indexOf("UA-");
        if (start === -1) return null;
        return rawId.slice(start);
    }, []);

    const cssEscape = useCallback((value) => {
        if (typeof value !== "string") return "";
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
        return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }, []);

    const onInlineSvgLoaded = useCallback(() => {
        setSvgReadyTick((x) => x + 1);
    }, []);

    /**
     * Force re-apply highlight whenever switching view (front/back or face/body),
     * even if InlineSvg's onLoad doesn't fire due to caching.
     */
    useEffect(() => {
        if (!open) return;
        setSvgReadyTick((x) => x + 1);
    }, [open, facingFront, mapView]);

    // Reset selections when modal opens
    useEffect(() => {
        if (open) {
            setSelectedLocations(initialSelections);
            setMapView("body");
            setFacingFront(true);
        }
    }, [open, initialSelections, coverageType]);

    const toggleSelection = useCallback(
        (selection) => {
            if (!selection) return;

            setSelectedLocations((prev) => {
                const selectionId = selection.selectionKey ?? selection.id;
                const existingIndex = prev.findIndex((loc) => (loc.selectionKey ?? loc.id) === selectionId);
                const isSelected = existingIndex !== -1;

                if (isSelected) {
                    const existing = prev[existingIndex];
                    const existingSvgIds = Array.isArray(existing?.svgIds) ? existing.svgIds : [];
                    const nextSvgIds = Array.isArray(selection?.svgIds) ? selection.svgIds : [];
                    const isSameSvgIds = existingSvgIds.length === nextSvgIds.length && existingSvgIds.every((id, idx) => id === nextSvgIds[idx]);

                    if (isSameSvgIds) {
                        return prev.filter((loc) => (loc.selectionKey ?? loc.id) !== selectionId);
                    }

                    const next = [...prev];
                    next[existingIndex] = selection;
                    return next;
                }

                if (isSingleMode) return [selection];
                return [...prev, selection];
            });
        },
        [isSingleMode]
    );

    // Close on ESC key
    useEffect(() => {
        if (!open) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    const handleLocationClick = useCallback(
        (svgId) => {
            if (mapView === "body" && svgId === "UA-face") {
                setMapView("faceDetail");
                setFacingFront(true);
                return;
            }

            if (mapView === "faceDetail") {
                const isFaceDetailId = typeof svgId === "string" && svgId.startsWith("UA-FaceDetail-");
                if (!isFaceDetailId) return;

                if (svgId === "UA-FaceDetail-outline") return;

                if (svgId === "UA-FaceDetail-eye-left" || svgId === "UA-FaceDetail-eye-right") {
                    toggleSelection({
                        id: 1268,
                        name: "Eye",
                        selectionKey: "1268:eyes",
                        svgIds: ["UA-FaceDetail-eye-left", "UA-FaceDetail-eye-right", "UA-face"],
                    });
                    return;
                }

                if (svgId === "UA-FaceDetail-ear-left" || svgId === "UA-FaceDetail-ear-right") {
                    toggleSelection({
                        id: 1208,
                        name: "Ear",
                        selectionKey: "1208:ears",
                        svgIds: ["UA-FaceDetail-ear-left", "UA-FaceDetail-ear-right", "UA-face"],
                    });
                    return;
                }

                if (svgId === "UA-FaceDetail-scalp") {
                    toggleSelection({
                        id: 1202,
                        name: "Scalp",
                        selectionKey: "1202:face-detail-scalp",
                        svgIds: ["UA-FaceDetail-scalp", "UA-scalp", "UA-scalp--back"],
                    });
                    return;
                }

                if (svgId === "UA-FaceDetail-neck") {
                    toggleSelection({
                        id: 1213,
                        name: "Neck",
                        selectionKey: "1213:face-detail-neck",
                        svgIds: ["UA-FaceDetail-neck", "UA-neck", "UA-neck--back"],
                    });
                    return;
                }

                if (svgId === "UA-FaceDetail-mouth") {
                    toggleSelection({
                        id: 1256,
                        name: "Mouth",
                        selectionKey: "1256:mouth",
                        svgIds: ["UA-FaceDetail-mouth", "UA-face"],
                    });
                    return;
                }

                if (svgId === "UA-FaceDetail-lips") {
                    toggleSelection({
                        id: 1209,
                        name: "Lips",
                        selectionKey: "1209:lips",
                        svgIds: ["UA-FaceDetail-lips", "UA-face"],
                    });
                    return;
                }

                toggleSelection({
                    id: 1203,
                    name: "Face",
                    selectionKey: `1203:face-detail:${svgId}`,
                    svgIds: [svgId, "UA-face"],
                });
                return;
            }

            const location = TOP_LEVEL_LOCATIONS.find((loc) => loc.svgIds.includes(svgId));
            if (!location) return;

            const baseSvgId = typeof svgId === "string" ? svgId.replace(/--back$/, "") : svgId;

            const buildSelection = () => {
                const handMatch = typeof baseSvgId === "string" ? baseSvgId.match(/^UA-hand-(left|right)$/) : null;
                const footMatch = typeof baseSvgId === "string" ? baseSvgId.match(/^UA-foot-(left|right)$/) : null;
                const groinMatch = typeof baseSvgId === "string" ? baseSvgId.match(/^UA-groin-(left|right)$/) : null;

                let baseIds = [baseSvgId];
                if (handMatch) baseIds = [`UA-hand-${handMatch[1]}`];
                else if (footMatch) baseIds = [`UA-foot-${footMatch[1]}`];
                else if (groinMatch) baseIds = [`UA-groin-${groinMatch[1]}`];

                const selectionSvgIds = [];
                baseIds.forEach((id) => {
                    if (location.svgIds.includes(id)) selectionSvgIds.push(id);
                    const backId = `${id}--back`;
                    if (location.svgIds.includes(backId)) selectionSvgIds.push(backId);

                    // Trunk heuristic: if user selected chest/stomach (front), highlight back as trunk too.
                    if (location.id === 1226 && (id === "UA-chest" || id === "UA-stomach") && location.svgIds.includes("UA-back")) {
                        selectionSvgIds.push("UA-back");
                    }
                    // And vice versa: selecting UA-back, highlight chest+stomach on front.
                    if (location.id === 1226 && id === "UA-back") {
                        if (location.svgIds.includes("UA-chest")) selectionSvgIds.push("UA-chest");
                        if (location.svgIds.includes("UA-stomach")) selectionSvgIds.push("UA-stomach");
                    }
                });

                const selectionKey = `${location.id}:${baseIds.join("+")}`;
                return {
                    ...location,
                    id: location.id,
                    selectionKey,
                    name: location.name,
                    svgIds: Array.from(new Set(selectionSvgIds.length > 0 ? selectionSvgIds : [baseSvgId])),
                };
            };

            toggleSelection(buildSelection());
        },
        [mapView, toggleSelection]
    );

    /**
     * Attach click handling to the container (NOT the <svg>) so it works even when InlineSvg injects SVG async.
     */
    useEffect(() => {
        if (!open) return;

        const container = svgContainerRef.current;
        if (!container) return;

        const handleClick = (event) => {
            const target = event?.target;
            if (!(target instanceof Element)) return;

            const anchor = target.closest?.("a");
            if (anchor) event.preventDefault?.();

            const elWithId = target.closest?.('[id*="UA-"]');
            const rawId = elWithId?.id || target.id;
            const uaId = extractUaId(rawId);
            if (!uaId) return;

            // Store click coordinates relative to SVG for dot positioning
            const svgElement = container.querySelector('svg');
            if (svgElement && event.clientX !== undefined && event.clientY !== undefined) {
                const svgRect = svgElement.getBoundingClientRect();
                const pt = svgElement.createSVGPoint();
                pt.x = event.clientX;
                pt.y = event.clientY;
                const svgP = pt.matrixTransform(svgElement.getScreenCTM().inverse());
                clickCoordsRef.current = {x: svgP.x, y: svgP.y};
            }

            const now = Date.now();
            if (lastClickRef.current.uaId === uaId && now - lastClickRef.current.ts < 50) return;
            lastClickRef.current = {uaId, ts: now};

            handleLocationClick(uaId);
        };

        container.addEventListener("click", handleClick);
        return () => container.removeEventListener("click", handleClick);
    }, [open, extractUaId, handleLocationClick]);

    /**
     * Apply a soft highlight and keep it across front/back switches.
     * Also tries fallback ids (add/remove --back) if the exact id doesn't exist in current SVG.
     * For single mode, creates a dot marker instead of filling the region.
     */
    useEffect(() => {
        if (!open) return;

        const container = svgContainerRef.current;
        if (!container) return;

        const APPLY_FILL = "rgba(236, 72, 153, 0.18)";
        const APPLY_STROKE = "rgba(236, 72, 153, 0.45)";
        const APPLY_STROKE_WIDTH = "1";

        // Remove any existing dot markers from previous renders
        container.querySelectorAll('.single-lesion-dot').forEach(el => el.remove());

        const findTarget = (svgElement, svgId) => {
            const escaped = cssEscape(svgId);
            let target = svgElement.querySelector(`#${escaped}, [id$="${escaped}"]`);
            if (target) return target;

            if (typeof svgId === "string") {
                const alt1 = svgId.endsWith("--back") ? svgId.replace(/--back$/, "") : `${svgId}--back`;
                const escapedAlt1 = cssEscape(alt1);
                target = svgElement.querySelector(`#${escapedAlt1}, [id$="${escapedAlt1}"]`);
                if (target) return target;
            }

            return null;
        };

        const applyHighlight = () => {
            const svgElement = container.querySelector("svg");
            if (!svgElement) return false;

            svgElement.querySelectorAll(".selected").forEach((el) => {
                el.classList.remove("selected");
                el.style.fill = "";
                el.style.fillOpacity = "";
                el.style.stroke = "";
                el.style.strokeWidth = "";
                el.removeAttribute("fill");
                el.removeAttribute("fill-opacity");
                el.removeAttribute("stroke");
                el.removeAttribute("stroke-width");
            });

            selectedLocations.forEach((location) => {
                if (!Array.isArray(location?.svgIds)) return;

                if (isSingleMode) {
                    // Single lesion: render exactly one dot on the first matching region in the current SVG.
                    let target = null;
                    for (const svgId of location.svgIds) {
                        if (svgId === "UA-FaceDetail-outline") continue;
                        const candidate = findTarget(svgElement, svgId);
                        if (candidate) {
                            target = candidate;
                            break;
                        }
                    }

                    if (!target) return;

                    try {
                        // Use click coordinates if available, otherwise fallback to bbox center
                        let dotX;
                        let dotY;
                        if (clickCoordsRef.current.x !== 0 || clickCoordsRef.current.y !== 0) {
                            dotX = clickCoordsRef.current.x;
                            dotY = clickCoordsRef.current.y;
                        } else {
                            const bbox = target.getBBox();
                            dotX = bbox.x + bbox.width / 2;
                            dotY = bbox.y + bbox.height / 2;
                        }

                        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        dot.setAttribute("class", "single-lesion-dot");
                        dot.setAttribute("cx", String(dotX));
                        dot.setAttribute("cy", String(dotY));
                        dot.setAttribute("r", "24");
                        dot.setAttribute("fill", "#ec4899");
                        dot.setAttribute("stroke", "#fff");
                        dot.setAttribute("stroke-width", "4");
                        dot.style.pointerEvents = "none";

                        svgElement.appendChild(dot);
                    } catch {
                        // If dot fails to render, do nothing (no region highlight in single mode).
                    }

                    return;
                }

                // Limited/Widespread mode: fill entire region
                for (const svgId of location.svgIds) {
                    if (svgId === "UA-FaceDetail-outline") continue;

                    const target = findTarget(svgElement, svgId);
                    if (!target) continue;

                    target.classList.add("selected");
                    target.style.fill = APPLY_FILL;
                    target.style.fillOpacity = "1";
                    target.setAttribute("fill", APPLY_FILL);
                    target.setAttribute("fill-opacity", "1");

                    target.style.stroke = APPLY_STROKE;
                    target.style.strokeWidth = APPLY_STROKE_WIDTH;
                    target.setAttribute("stroke", APPLY_STROKE);
                    target.setAttribute("stroke-width", APPLY_STROKE_WIDTH);
                }
            });

            return true;
        };

        if (applyHighlight()) return;

        const t = setTimeout(applyHighlight, 50);
        return () => clearTimeout(t);
    }, [open, selectedLocations, mapView, facingFront, cssEscape, svgReadyTick, isSingleMode]);

    if (!open) return null;

    const handleDone = () => onDone(selectedLocations);

    const handleBackInternal = () => {
        if (mapView === "faceDetail") {
            setMapView("body");
            return;
        }
        (onBack ?? onClose)();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <button type="button" className={styles.backButton} onClick={handleBackInternal} aria-label="Back">
            <span className={styles.backIcon} aria-hidden="true">
              ‹
            </span>
                    </button>
                    <h2 className={styles.title}>Affected Area</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* ✅ Scrollable content area */}
                <div className={styles.content}>
                    {/* Body Map SVG */}
                    <div className={styles.bodyMapContainer}>
                        <div className={styles.bodyMapFrame} ref={svgContainerRef}>
                            {mapView === "faceDetail" ? (
                                <InlineSvg src="/images/bodies/UA-FaceDetail-RashRegions.svg"
                                           className={styles.bodyMapSvg} onLoad={onInlineSvgLoaded}/>
                            ) : facingFront ? (
                                <InlineSvg src="/images/bodies/body-map-locations.svg" className={styles.bodyMapSvg}
                                           onLoad={onInlineSvgLoaded}/>
                            ) : (
                                <InlineSvg src="/images/bodies/body-map-locations--back.svg"
                                           className={styles.bodyMapSvg} onLoad={onInlineSvgLoaded}/>
                            )}
                        </div>
                    </div>

                    {/* Front/Back Toggle */}
                    {mapView === "body" && (
                        <div className={styles.toggleContainer}>
                            <div className={styles.togglePill} role="tablist" aria-label="Body view">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={facingFront}
                                    className={`${styles.toggleButton} ${facingFront ? styles.active : ""}`}
                                    onClick={() => setFacingFront(true)}
                                >
                                    Front
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={!facingFront}
                                    className={`${styles.toggleButton} ${!facingFront ? styles.active : ""}`}
                                    onClick={() => setFacingFront(false)}
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Selected Locations */}
                    {selectedLocations.length > 0 && (
                        <div className={styles.selectedList}>
                            <div className={styles.selectedLabel}>Location</div>
                            <div className={styles.selectedItems}>
                                {displayedLocations.map((loc) => (
                                    <span key={String(loc.id)} className={styles.selectedChip}>
                    {loc.name}
                                        <button
                                            type="button"
                                            className={styles.chipRemove}
                                            onClick={() => setSelectedLocations((prev) => prev.filter((l) => Number(l?.id) !== Number(loc?.id)))}
                                        >
                      ×
                    </button>
                  </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Done Button */}
                <div className={styles.footer}>
                    <button className={`${styles.doneButton} ${!canSubmit ? styles.disabled : ""}`} onClick={handleDone}
                            disabled={!canSubmit}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
