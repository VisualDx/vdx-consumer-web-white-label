// src/lib/lesionHierarchy.js
import hierarchy from "@/../public/lesion_hierarchy.json";

/**
 * Build a map from findingId -> finding info (icon/name/description)
 * so when API returns { lesion: { id, name } } we can attach the correct icon.
 */
function buildFindingIndex() {
    const byId = new Map();

    const walkQuestion = (questionNode) => {
        if (!questionNode?.answers) return;

        for (const ans of questionNode.answers) {
            // Leaf: has findings
            if (Array.isArray(ans.findings)) {
                for (const f of ans.findings) {
                    if (!f?.findingId) continue;
                    byId.set(f.findingId, {
                        id: f.findingId,
                        name: f.name,
                        description: f.description,
                        icon: f.icon, // <-- icon base name, render as /icons/<icon>.png
                    });
                }
            }
            // Branch: has nested question
            if (ans?.question) walkQuestion(ans.question);
        }
    };

    walkQuestion(hierarchy);
    return byId;
}

const FINDING_INDEX = buildFindingIndex();

export function getFindingById(findingId) {
    if (findingId == null) return null;
    return FINDING_INDEX.get(Number(findingId)) || null;
}

export function getIconSrc(iconBaseName) {
    if (!iconBaseName) return null;
    return `/icons/${iconBaseName}.png`;
}

export default hierarchy;
