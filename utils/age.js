export function ageGroupIdToAgeItem(ageGroupId) {
    const id = Number(ageGroupId);
    if (!Number.isFinite(id)) return null;

    switch (id) {
        case 0: return { value: 1, unit: "month" };  // < 1 month
        case 1: return { value: 12, unit: "month" }; // 1–23 months
        case 2: return { value: 6, unit: "year" };   // 2–12 years
        case 3: return { value: 16, unit: "year" };  // 13–19
        case 4: return { value: 25, unit: "year" };  // 20–29
        case 5: return { value: 35, unit: "year" };  // 30–39
        case 6: return { value: 45, unit: "year" };  // 40–49
        case 7: return { value: 55, unit: "year" };  // 50–59
        case 8: return { value: 65, unit: "year" };  // 60–69
        case 9: return { value: 75, unit: "year" };  // 70–79
        case 10: return { value: 85, unit: "year" }; // 80+
        default: return null;
    }
}
