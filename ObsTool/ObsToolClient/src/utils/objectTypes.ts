export interface IDsoTypeDefinition {
    abbreviation: string;
    longName: string;
}

export const dsoTypeMap = new Map<string, IDsoTypeDefinition>([
    ["ASTER", { abbreviation: "As", longName: "Asterism" }],
    ["BRTNB", { abbreviation: "Nb", longName: "Bright Nebula" }],
    ["CL+NB", { abbreviation: "CL+NB", longName: "Cluster with Nebulosity" }],
    ["DRKNB", { abbreviation: "DRKNB", longName: "Dark Nebula" }],
    ["GALCL", { abbreviation: "GALCL", longName: "Galaxy cluster" }],
    ["GALXY", { abbreviation: "Gx", longName: "Galaxy" }],
    ["GLOCL", { abbreviation: "GC", longName: "Globular Cluster" }],
    ["GX+DN", { abbreviation: "GX+DN", longName: "Diffuse Nebula in a Galaxy" }],
    ["GX+GC", { abbreviation: "GX+GC", longName: "Globular Cluster in a Galaxy" }],
    ["G+C+N", { abbreviation: "G+C+N", longName: "Cluster with Nebulosity in a Galaxy" }],
    ["LMCCN", { abbreviation: "LMCCN", longName: "Cluster with Nebulosity in the LMC" }],
    ["LMCDN", { abbreviation: "LMCDN", longName: "Diffuse Nebula in the LMC" }],
    ["LMCGC", { abbreviation: "LMCGC", longName: "Globular Cluster in the LMC" }],
    ["LMCOC", { abbreviation: "LMCOC", longName: "Open cluster in the LMC" }],
    ["NONEX", { abbreviation: "NONEX", longName: "Nonexistent" }],
    ["OPNCL", { abbreviation: "OC", longName: "Open Cluster" }],
    ["PLNNB", { abbreviation: "PN", longName: "Planetary Nebula" }],
    ["PLANET", { abbreviation: "Pla", longName: "Planet" }],
    ["SMCCN", { abbreviation: "SMCCN", longName: "Cluster with Nebulosity in the SMC" }],
    ["SMCDN", { abbreviation: "SMCDN", longName: "Diffuse Nebula in the SMC" }],
    ["SMCGC", { abbreviation: "SMCGC", longName: "Globular Cluster in the SMC" }],
    ["SMCOC", { abbreviation: "SMCOC", longName: "Open cluster in the SMC" }],
    ["SNREM", { abbreviation: "SNREM", longName: "Supernova Remnant" }],
    ["QUASR", { abbreviation: "QUASR", longName: "Quasar" }],
    ["MOON", { abbreviation: "Moon", longName: "Moon" }],
    ["ASTEROID", { abbreviation: "Ast", longName: "Asteroid" }],
    ["COMET", { abbreviation: "Com", longName: "Comet" }],
    ["METSHOWER", { abbreviation: "Met", longName: "Meteor shower" }],
    ["SUN", { abbreviation: "Sun", longName: "Sun" }],
    ["DBLSTAR", { abbreviation: "Dbl", longName: "Double star" }],
    ["VARSTAR", { abbreviation: "Var", longName: "Variable star" }],
    ["SUPERNOVA", { abbreviation: "SN", longName: "Supernova" }],
    ["1STAR", { abbreviation: "1STAR", longName: "1 Star" }],
    ["2STAR", { abbreviation: "2STAR", longName: "2 Stars" }],
    ["3STAR", { abbreviation: "3STAR", longName: "3 Stars" }],
    ["4STAR", { abbreviation: "4STAR", longName: "4 Stars" }],
    ["8STAR", { abbreviation: "8STAR", longName: "8 Stars" }]
]);

// Looks up metadata for a stored SAC type code.
export function getDsoTypeDefinition(type: string) {
    return dsoTypeMap.get((type || "").trim().toUpperCase());
}

// Returns the app-facing short type label used when the UI has room only for an abbreviation.
export function getDsoTypeAbbreviation(type: string) {
    return getDsoTypeDefinition(type)?.abbreviation;
}

// Returns the long display name for known SAC object types.
export function translateDsoType(type: string) {
    return getDsoTypeDefinition(type)?.longName;
}

// Returns the known SAC type codes in long-name order for editable object forms.
export function getDsoTypeOptions() {
    return Array.from(dsoTypeMap.entries())
        .map(([code, type]) => ({ code, ...type }))
        .sort((left, right) => left.longName.localeCompare(right.longName));
}

// Resolves a SAC code, app abbreviation, or long name to the stored SAC code.
export function resolveDsoTypeCode(value: string) {
    const normalizedValue = (value || "").trim().toLowerCase();
    const matchedOption = getDsoTypeOptions().find(option =>
        option.code.toLowerCase() === normalizedValue ||
        option.abbreviation.toLowerCase() === normalizedValue ||
        option.longName.toLowerCase() === normalizedValue);
    return matchedOption?.code || value;
}
