export const WIDESPREAD_FINDING_ID = 20192;
// export const WIDESPREAD_FINDING_LABEL =
//     "Distribution:Extensive Rash Pattern:Widespread distribution";
export const WIDESPREAD_FINDING_LABEL ="";
function dedupeLocationsById(selectedLocations) {
    const unique = [];
    const seen = new Set();

    (selectedLocations ?? []).forEach((loc) => {
        const id = Number(loc?.id);
        const name = loc?.name;
        if (!Number.isFinite(id) || !name) return;
        if (seen.has(id)) return;
        seen.add(id);
        unique.push({ id, name });
    });

    return unique;
}

export function buildAffectedAreaFindings({ coverageType, selectedLocations }) {
    if (coverageType === "widespread") {
        return [{ id: WIDESPREAD_FINDING_ID, name: WIDESPREAD_FINDING_LABEL }];
    }

    if (coverageType === "single" || coverageType === "limited") {
        return dedupeLocationsById(selectedLocations);
    }

    return [];
}

export function getAffectedAreaSummaryDisplay({ coverageType, selectedLocations }) {
    if (!coverageType) return null;

    if (coverageType === "widespread") {
        return { title: "Widespread", sub: WIDESPREAD_FINDING_LABEL };
    }

    const uniqueLocations = dedupeLocationsById(selectedLocations);
    if (uniqueLocations.length === 0) return null;

    const title = coverageType === "single" ? "Single Lesion" : "Limited Area";
    const sub = uniqueLocations.map((loc) => loc.name).join(", ");
    return { title, sub };
}

export function getAffectedAreaSummaryText({ coverageType, selectedLocations }) {
    if (!coverageType) return "Select";

    if (coverageType === "widespread") {
        return WIDESPREAD_FINDING_LABEL;
    }

    const uniqueLocations = dedupeLocationsById(selectedLocations);
    if (uniqueLocations.length === 0) return "Select";

    const prefix = coverageType === "single" ? "Single Lesion: " : "Limited Area: ";
    const locationNames = uniqueLocations.map((loc) => loc.name).join(", ");
    return prefix + locationNames;
}
