export interface IDsoTypeDefinition {
    abbreviation: string;
    longName: string;
    // Controls Type dropdown suggestions; omitted values default to visible.
    showInDropdown?: boolean;
}

export const dsoTypeMap = new Map<string, IDsoTypeDefinition>([
    ["ASTER", { abbreviation: "As", longName: "Asterism" }],
    ["BRTNB", { abbreviation: "Nb", longName: "Bright Nebula" }],
    ["CL+NB", { abbreviation: "CL+NB", longName: "Cluster with Nebulosity" }],
    ["DRKNB", { abbreviation: "DRKNB", longName: "Dark Nebula" }],
    ["GALCL", { abbreviation: "GALCL", longName: "Galaxy cluster" }],
    ["GALXY", { abbreviation: "Gx", longName: "Galaxy" }],
    ["GLOCL", { abbreviation: "GC", longName: "Globular Cluster" }],
    ["GX+DN", { abbreviation: "GX+DN", longName: "In Galaxy: Nebula" }],
    ["GX+GC", { abbreviation: "GX+GC", longName: "In Galaxy: Globular Cluster" }],
    ["G+C+N", { abbreviation: "G+C+N", longName: "In Galaxy: Cluster with Nebulosity" }],
    ["GX+SA", { abbreviation: "GX+SA", longName: "In Galaxy: Stellation Association" }],
    ["GX+OC", { abbreviation: "GX+OC", longName: "In Galaxy: Open cluster" }],
    ["LMCCN", { abbreviation: "LMCCN", longName: "In LMC: Cluster with Nebulosity", showInDropdown: false }],
    ["LMCDN", { abbreviation: "LMCDN", longName: "In LMC: Nebula", showInDropdown: false }],
    ["LMCGC", { abbreviation: "LMCGC", longName: "In LMC: Globular Cluster", showInDropdown: false }],
    ["LMCOC", { abbreviation: "LMCOC", longName: "In LMC: Open cluster", showInDropdown: false }],
    ["SMCCN", { abbreviation: "SMCCN", longName: "In SMC: Cluster with Nebulosity", showInDropdown: false }],
    ["SMCDN", { abbreviation: "SMCDN", longName: "In SMC: Nebula", showInDropdown: false }],
    ["SMCGC", { abbreviation: "SMCGC", longName: "In SMC: Globular Cluster", showInDropdown: false }],
    ["SMCOC", { abbreviation: "SMCOC", longName: "In SMC: Open cluster", showInDropdown: false }],
    ["NONEX", { abbreviation: "NONEX", longName: "Nonexistent" }],
    ["OPNCL", { abbreviation: "OC", longName: "Open Cluster" }],
    ["PLNNB", { abbreviation: "PN", longName: "Planetary Nebula" }],
    ["PLANET", { abbreviation: "Pla", longName: "Planet" }],
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

// Returns dropdown-visible SAC types in map insertion order; includeHidden also exposes catalog-only types.
export function getDsoTypeOptions(includeHidden = false) {
    return Array.from(dsoTypeMap.entries())
        .filter(([, type]) => includeHidden || type.showInDropdown !== false)
        .map(([code, type]) => ({ code, ...type }));
}

// Resolves a SAC code, app abbreviation, or long name to the stored SAC code.
export function resolveDsoTypeCode(value: string) {
    const normalizedValue = (value || "").trim().toLowerCase();
    const matchedOption = getDsoTypeOptions(true).find(option =>
        option.code.toLowerCase() === normalizedValue ||
        option.abbreviation.toLowerCase() === normalizedValue ||
        option.longName.toLowerCase() === normalizedValue);
    return matchedOption?.code || value;
}
