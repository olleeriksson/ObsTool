export const dsoTypeMap = new Map([
    ["ASTER", "Asterism"],
    ["BRTNB", "Bright Nebula"],
    ["CL+NB", "Cluster with Nebulosity"],
    ["DRKNB", "Dark Nebula"],
    ["GALCL", "Galaxy cluster"],
    ["GALXY", "Galaxy"],
    ["GLOCL", "Globular Cluster"],
    ["GX+DN", "Diffuse Nebula in a Galaxy"],
    ["GX+GC", "Globular Cluster in a Galaxy"],
    ["G+C+N", "Cluster with Nebulosity in a Galaxy"],
    ["LMCCN", "Cluster with Nebulosity in the LMC"],
    ["LMCDN", "Diffuse Nebula in the LMC"],
    ["LMCGC", "Globular Cluster in the LMC"],
    ["LMCOC", "Open cluster in the LMC"],
    ["NONEX", "Nonexistent"],
    ["OPNCL", "Open Cluster"],
    ["PLNNB", "Planetary Nebula"],
    ["SMCCN", "Cluster with Nebulosity in the SMC"],
    ["SMCDN", "Diffuse Nebula in the SMC"],
    ["SMCGC", "Globular Cluster in the SMC"],
    ["SMCOC", "Open cluster in the SMC"],
    ["SNREM", "Supernova Remnant"],
    ["QUASR", "Quasar"],
    ["1STAR", "1 Star"],
    ["2STAR", "2 Stars"],
    ["3STAR", "3 Stars"],
    ["4STAR", "4 Stars"],
    ["8STAR", "8 Stars"]
]);

export function translateDsoType(type: string) {
    return dsoTypeMap.get(type);
}

// Returns the known SAC type codes in display-label order for editable object forms.
export function getDsoTypeOptions() {
    return Array.from(dsoTypeMap.entries())
        .map(([code, label]) => ({ code, label }))
        .sort((left, right) => left.label.localeCompare(right.label));
}

// Resolves either a SAC type code or its translated label to the stored SAC code.
export function resolveDsoTypeCode(value: string) {
    const normalizedValue = (value || "").trim().toLowerCase();
    const matchedOption = getDsoTypeOptions().find(option =>
        option.code.toLowerCase() === normalizedValue ||
        option.label.toLowerCase() === normalizedValue);
    return matchedOption?.code || value;
}
