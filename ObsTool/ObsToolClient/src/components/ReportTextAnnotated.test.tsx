import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import Api from "../api/Api";
import { IEyepiece } from "../types/Types";
import {
  getEyepiecesCached,
  invalidateEyepiecesCache,
  replaceEyepiecesCache,
  renderReportTextAnnotated,
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

// Verifies optical annotations as rendered report text, including incomplete instrument data.
describe("renderReportTextAnnotated", () => {
  const eyepiece = { ...createEyepiece(1, "ES92 17mm"), focalLengthMm: "17" };

  it("displays magnification and exit pupil calculated before rounding magnification", () => {
    const instrument = { name: "Telescope", focalLengthMm: 1200, diameterMm: 250 };
    const { container } = render(
      <>{renderReportTextAnnotated("Used ES92 17mm on M 31.", instrument, [eyepiece])}</>
    );

    expect(container.textContent).toBe("Used ES92 17mm (71x, 3.5mm EP) on M 31.");
  });

  it.each([undefined, null, 0, -250, Number.NaN, Number.POSITIVE_INFINITY])(
    "keeps magnification alone when the diameter is %s",
    diameterMm => {
      const instrument = { name: "Telescope", focalLengthMm: 1200, diameterMm };
      const { container } = render(
        <>{renderReportTextAnnotated("ES92 17mm", instrument, [eyepiece])}</>
      );

      expect(container.textContent).toBe("ES92 17mm (71x)");
    }
  );
});
