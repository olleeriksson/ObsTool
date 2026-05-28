import { resolveDsoTypeCode } from "./objectTypes";

export type DsoTypeIconVariant =
    "asterism" |
    "brightNebula" |
    "clusterNebula" |
    "darkNebula" |
    "galaxy" |
    "galaxyCluster" |
    "galaxyClusterNebula" |
    "galaxyDiffuseNebula" |
    "galaxyGlobularCluster" |
    "globularCluster" |
    "nonexistent" |
    "openCluster" |
    "planetaryNebula" |
    "quasar" |
    "supernovaRemnant" |
    "oneStar" |
    "twoStars" |
    "threeStars" |
    "fourStars" |
    "eightStars" |
    "planet" |
    "moon" |
    "asteroid" |
    "comet" |
    "meteorShower" |
    "sun" |
    "doubleStar" |
    "variableStar" |
    "supernova" |
    "generic";

export const DSO_TYPE_ICON_PREVIEW_SIZES = [16, 22, 32];

const TYPE_ICON_VARIANTS = new Map<string, DsoTypeIconVariant>([
    ["ASTER", "asterism"],
    ["BRTNB", "brightNebula"],
    ["CL+NB", "clusterNebula"],
    ["DRKNB", "darkNebula"],
    ["GALXY", "galaxy"],
    ["GX+DN", "galaxyDiffuseNebula"],
    ["GX+GC", "galaxyGlobularCluster"],
    ["G+C+N", "clusterNebula"],
    ["GLOCL", "globularCluster"],
    ["LMCCN", "clusterNebula"],
    ["LMCDN", "brightNebula"],
    ["LMCGC", "globularCluster"],
    ["LMCOC", "openCluster"],
    ["NONEX", "nonexistent"],
    ["OPNCL", "openCluster"],
    ["PLNNB", "planetaryNebula"],
    ["PLANET", "planet"],
    ["SMCCN", "clusterNebula"],
    ["SMCDN", "brightNebula"],
    ["SMCGC", "globularCluster"],
    ["SMCOC", "openCluster"],
    ["SNREM", "supernovaRemnant"],
    ["QUASR", "quasar"],
    ["GALCL", "galaxyCluster"],
    ["MOON", "moon"],
    ["ASTEROID", "asteroid"],
    ["COMET", "comet"],
    ["METSHOWER", "meteorShower"],
    ["SUN", "sun"],
    ["DBLSTAR", "doubleStar"],
    ["VARSTAR", "variableStar"],
    ["SUPERNOVA", "supernova"],
    ["1STAR", "oneStar"],
    ["2STAR", "twoStars"],
    ["3STAR", "threeStars"],
    ["4STAR", "fourStars"],
    ["8STAR", "eightStars"],
]);

// Chooses the chart-symbol glyph for known SAC object types and the generic glyph for the rest.
export function getDsoTypeIconVariant(type?: string | null): DsoTypeIconVariant {
    const normalizedTypeCode = resolveDsoTypeCode(type || "").trim().toUpperCase();
    return TYPE_ICON_VARIANTS.get(normalizedTypeCode) || "generic";
}
