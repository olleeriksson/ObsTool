const dsoTypeMap = new Map([
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
    ["4STAR", "4 Stars"]
]);

export function translateDsoType(type: string) {
    return dsoTypeMap.get(type);
}
