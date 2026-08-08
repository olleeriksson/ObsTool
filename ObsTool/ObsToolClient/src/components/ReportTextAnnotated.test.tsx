import { beforeEach, describe, expect, it, vi } from "vitest";
import Api from "../api/Api";
import { IEyepiece } from "../types/Types";
import {
  getEyepiecesCached,
  invalidateEyepiecesCache,
  replaceEyepiecesCache,
} from "./ReportTextAnnotated";

// Creates the smallest complete eyepiece needed by the cache tests.
const createEyepiece = (id: number, key: string): IEyepiece => ({
  id,
  key,
  name: key,
  focalLengthMm: "10",
});

describe("ReportTextAnnotated eyepiece cache", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateEyepiecesCache();
  });

  it("uses replacement data after eyepiece reference data is refreshed", async () => {
    const original = createEyepiece(1, "OLD");
    const replacement = createEyepiece(2, "NEW");
    const getEyepieces = vi.spyOn(Api, "getEyepieces").mockResolvedValue({ data: [original] } as any);

    expect(await getEyepiecesCached()).toEqual([original]);

    replaceEyepiecesCache([replacement]);

    expect(await getEyepiecesCached()).toEqual([replacement]);
    expect(getEyepieces).toHaveBeenCalledTimes(1);
  });

  it("retries after a transient API failure instead of caching an empty result", async () => {
    const recovered = createEyepiece(2, "RECOVERED");
    const getEyepieces = vi.spyOn(Api, "getEyepieces")
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce({ data: [recovered] } as any);

    expect(await getEyepiecesCached()).toEqual([]);
    expect(await getEyepiecesCached()).toEqual([recovered]);
    expect(getEyepieces).toHaveBeenCalledTimes(2);
  });
});
