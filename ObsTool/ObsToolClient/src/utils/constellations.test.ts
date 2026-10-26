import { describe, expect, it } from "vitest";
import { formatConstellationAbbreviation } from "./constellations";

// Cover uppercase stored values, ordinary names, and every internal-capital exception.
describe("formatConstellationAbbreviation", () => {
  it.each(["And", "Ori", "CVn", "CMa", "CMi", "CrA", "CrB", "LMi", "PsA", "TrA", "UMa", "UMi"])(
    "formats %s consistently regardless of input casing",
    abbreviation => {
      expect(formatConstellationAbbreviation(abbreviation.toUpperCase())).toBe(abbreviation);
      expect(formatConstellationAbbreviation(abbreviation.toLowerCase())).toBe(abbreviation);
      expect(formatConstellationAbbreviation(abbreviation)).toBe(abbreviation);
    }
  );

  it("handles absent values, whitespace, and unrecognized text", () => {
    expect(formatConstellationAbbreviation()).toBe("");
    expect(formatConstellationAbbreviation(null)).toBe("");
    expect(formatConstellationAbbreviation("  ")).toBe("");
    expect(formatConstellationAbbreviation(" AND ")).toBe("And");
    expect(formatConstellationAbbreviation("Unknown")).toBe("Unknown");
  });
});
