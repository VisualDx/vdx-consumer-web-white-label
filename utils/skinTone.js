// utils/skinTone.js

const isValidSkinType = (v) => Number.isInteger(v) && v >= 1 && v <= 6;

// James note: dark-first order starts with 5 then decreases distance from 5: [5,4,6,3,2,1]
const DARK_FIRST = [5, 4, 6, 3, 2, 1];

// Mirror for light-first (closest to 1 first): [1,2,3,6,4,5]
const LIGHT_FIRST = [1, 2, 3, 6, 4, 5];

const buildRankMap = (order) =>
    order.reduce((acc, t, idx) => {
        acc[t] = idx;
        return acc;
    }, {});

/**
 * Sort ONLY the images that have valid skinType, then put them back into the original
 * positions where "skinType images" existed. Images without skinType stay in place.
 * This mimics the backend sortDermImages behavior James described.
 */
export function sortImagesBySkinTone(images, skinTone) {
    const src = Array.isArray(images) ? images : [];
    if (!skinTone) return src;

    const order = skinTone === "dark" ? DARK_FIRST : skinTone === "light" ? LIGHT_FIRST : null;
    if (!order) return src;

    const rank = buildRankMap(order);

    // Extract "derm images" (ones with valid skinType)
    const derm = src
        .filter((img) => isValidSkinType(img?.skinType))
        .map((img, originalIndex) => ({ img, originalIndex }));

    if (derm.length === 0) return src;

    // Stable sort by skinType preference; tie-break by original order
    derm.sort((a, b) => {
        const ra = rank[a.img.skinType] ?? 999;
        const rb = rank[b.img.skinType] ?? 999;
        if (ra !== rb) return ra - rb;
        return a.originalIndex - b.originalIndex;
    });

    // Rebuild list: replace only slots that originally had valid skinType images
    const dermQueue = derm.map((x) => x.img);
    const rebuilt = src.map((img) => {
        if (isValidSkinType(img?.skinType)) {
            return dermQueue.shift() ?? img;
        }
        return img; // keep non-derm images in place
    });

    return rebuilt;
}
