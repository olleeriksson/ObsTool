import { createGridSegments, getMapGridSpacing } from "./ConstellationMapGrid";
import { interstellarumCharts } from "./InterstellarumAtlas";

// Check every atlas chart against the requested ranges, including both sides of each transition.
it("uses the specified RA intervals and one-degree DEC spacing for all 114 charts", () => {
    const chartBands = [
        { first: 1, last: 1, raMinutes: 30 },
        { first: 2, last: 7, raMinutes: 20 },
        { first: 8, last: 15, raMinutes: 10 },
        { first: 16, last: 99, raMinutes: 5 },
        { first: 100, last: 107, raMinutes: 10 },
        { first: 108, last: 113, raMinutes: 20 },
        { first: 114, last: 114, raMinutes: 30 },
    ];
    for (const band of chartBands) {
        for (let chart = band.first; chart <= band.last; chart++) {
            // Deliberately use an unrelated center so atlas chart numbers must take precedence.
            expect(getMapGridSpacing(0, chart), `Chart ${chart}`).toEqual({ raMinutes: band.raMinutes, decDegrees: 1 });
        }
    }
});

// Keep the atlas's declination-dependent proportions with half as many lines in large constellation maps.
it("doubles both atlas intervals for large constellation maps", () => {
    for (const chart of interstellarumCharts) {
        const atlasSpacing = getMapGridSpacing(chart.projection_center_dec_deg, chart.chart);
        expect(getMapGridSpacing(chart.projection_center_dec_deg, undefined, { width: 1000, height: 760 })).toEqual({
            raMinutes: atlasSpacing.raMinutes * 2, decDegrees: 2,
        });
    }
});

// The midpoint of adjacent atlas centers belongs to the band nearer the pole.
it("switches RA spacing at discrete declination thresholds in both hemispheres", () => {
    for (const sign of [-1, 1]) {
        for (const [declination, minutes] of [[0, 5], [52.499, 5], [52.5, 10], [67.499, 10], [67.5, 20], [82.499, 20], [82.5, 30], [90, 30]]) {
            expect(getMapGridSpacing(sign * declination)).toEqual({ raMinutes: minutes * 2, decDegrees: 2 });
        }
    }
});

// Inspect coordinates, including the RA wrap, rather than relying on line counts alone.
it("generates aligned grids with even RA wrap and no parallels beyond the poles", () => {
    for (const size of [800, 500, 400, 160]) {
        for (const declination of [0, 60, 75, 90, -90]) {
            const spacing = getMapGridSpacing(declination, undefined, { width: size, height: size });
            const segments = createGridSegments([{ longitude: 0, latitude: declination }], spacing);
            const meridianCount = 1440 / spacing.raMinutes;
            const meridians = segments.slice(0, meridianCount);
            const parallels = segments.slice(meridianCount);
            expect(meridians[0][0][0]).toBe(180);
            for (let i = 0; i < meridians.length; i++) {
                const longitude = meridians[i][0][0];
                expect(meridians[i].every(point => point[0] === longitude)).toBe(true);
                const next = meridians[(i + 1) % meridians.length][0][0];
                expect((next - longitude + 360) % 360).toBe(spacing.raMinutes / 4);
            }
            for (let i = 0; i < parallels.length; i++) {
                const latitude = parallels[i][0][1];
                expect(parallels[i].every(point => point[1] === latitude)).toBe(true);
                expect(latitude).toBeGreaterThanOrEqual(-89);
                expect(latitude).toBeLessThanOrEqual(89);
                expect(latitude % spacing.decDegrees === 0).toBe(true);
                if (i > 0) { expect(latitude - parallels[i - 1][0][1]).toBe(spacing.decDegrees); }
            }
        }
    }
});

// Use real plot area instead of the caller's identity, preserving the same ratio in every presentation.
it("reduces grid density further for card maps, hover maps, and narrow previews", () => {
    for (const [width, height, scale] of [[1000, 760, 2], [700, 500, 4], [416, 400, 8], [136, 136, 12], [200, 760, 8]]) {
        for (const declination of [0, 60, 75, 90, -90]) {
            const base = getMapGridSpacing(declination);
            expect(getMapGridSpacing(declination, undefined, { width, height })).toEqual({
                raMinutes: base.raMinutes * scale / 2, decDegrees: scale,
            });
        }
    }
});

// A small atlas presentation must still retain the user's specific chart intervals.
it("keeps all Interstellarum charts independent of display size", () => {
    for (const chart of interstellarumCharts) {
        expect(getMapGridSpacing(0, chart.chart, { width: 160, height: 160 })).toEqual(getMapGridSpacing(0, chart.chart));
    }
});
