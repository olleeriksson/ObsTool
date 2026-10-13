import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import ConstellationMap from "./ConstellationMap";
import ConstellationView from "./ConstellationView";
import ConstellationLabelStatus from "./ConstellationLabelStatus";
import { chartContainsPosition, getObjectCharts, interstellarumCharts } from "./InterstellarumAtlas";
import { getLabelVisibilityState, labelVisibilityStorageKey, resetHiddenLabels, toggleHiddenLabel } from "../store/LabelVisibilityStore";

// Reset persisted preferences so scope tests cannot inherit hidden choices from other tests.
beforeEach(() => {
    localStorage.removeItem(labelVisibilityStorageKey);
    window.dispatchEvent(new StorageEvent("storage", { key: labelVisibilityStorageKey }));
});

// Test all chart centers and both polar caps without approximating them as RA/Dec rectangles.
it("includes all centers and polar positions and preserves multiple memberships", () => {
    expect(interstellarumCharts).toHaveLength(114);
    expect(chartContainsPosition(interstellarumCharts[56], { longitude: NaN, latitude: 0 })).toBe(false);
    for (const chart of interstellarumCharts) {
        const position = { longitude: (chart.projection_center_ra_hours ?? 0) * 15, latitude: chart.projection_center_dec_deg };
        expect(chartContainsPosition(chart, position)).toBe(true);
        expect(chartContainsPosition(chart, { longitude: position.longitude + 180, latitude: -position.latitude })).toBe(false);
    }
    for (const longitude of [0, 90, 180, 270]) {
        expect(chartContainsPosition(interstellarumCharts[0], { longitude, latitude: 90 })).toBe(true);
        expect(chartContainsPosition(interstellarumCharts[113], { longitude, latitude: -90 })).toBe(true);
    }
    expect(getObjectCharts({ name: "Overlap", ra: "14 00", dec: "+00 00" })).toEqual(expect.arrayContaining([56, 57]));
});

// Validate sampled edge points and quadrilateral corner orientation for all extrapolated bands.
it("includes the supplied boundary vertices within their rounding precision", () => {
    for (const chart of interstellarumCharts) {
        for (const page of chart.pages) {
            for (const [longitude, latitude] of page.boundary_ra_dec_deg) {
                expect(chartContainsPosition(chart, { longitude, latitude }), `Chart ${chart.chart}: ${longitude}, ${latitude}`).toBe(true);
            }
        }
    }
});

// Reuse the map's controls while keeping choices isolated between overlapping charts and constellations.
it("isolates hidden labels by chart and retains the same marker-group controls", () => {
    const object = { name: "Overlap", herschelId: 1, ra: "14 00", dec: "+00 00", h400: true };
    const props = { constellationName: "Chart 57", constellationAbbrv: "INTERSTELLARUM-57", chart: interstellarumCharts[56], objects: [object] };
    const { rerender } = render(<ConstellationView {...props} />);
    expect(screen.getByRole("img", { name: "Interstellarum chart map" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).not.toBeInTheDocument();
    expect(getLabelVisibilityState().hiddenByConstellation["INTERSTELLARUM-57"]).toEqual(["h-1"]);
    rerender(<ConstellationView {...props} constellationAbbrv="INTERSTELLARUM-56" chart={interstellarumCharts[55]} />);
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).toBeInTheDocument();
    act(() => { toggleHiddenLabel("ORI", "h-1"); });
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Highlighted objects" }));
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Highlighted objects" }));
    expect(screen.getByRole("img", { name: "Interstellarum chart map" }).querySelector("text")).toBeInTheDocument();
    act(() => { resetHiddenLabels("INTERSTELLARUM-57"); });
    expect(getLabelVisibilityState().hiddenByConstellation.ORI).toEqual(["h-1"]);
});

// Horizon status uses the chart's physical declination range, including empty charts.
it("classifies chart visibility independently of constellation boundaries", () => {
    render(<table><tbody><tr>
        <ConstellationLabelStatus constellation="INTERSTELLARUM-114" chart={interstellarumCharts[113]} total={1} />
        <ConstellationLabelStatus constellation="INTERSTELLARUM-82" chart={interstellarumCharts[81]} total={1} />
        <ConstellationLabelStatus constellation="INTERSTELLARUM-57" chart={interstellarumCharts[56]} total={0} />
    </tr></tbody></table>);
    expect(screen.getByRole("img", { name: /chart 114: Never visible/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /chart 82: Partly visible/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /chart 57: Fully visible.*No Herschel/ })).toBeInTheDocument();
});

// Check rendered marker positions so the polar RA orientation covers the full map projection path.
it.each([
    { chartNumber: 1, bottomRa: "00 00", topRa: "12 00", dec: "+85 00" },
    { chartNumber: 114, bottomRa: "12 00", topRa: "00 00", dec: "-85 00" },
])("orients chart $chartNumber with its specified RA towards the bottom", ({ chartNumber, bottomRa, topRa, dec }) => {
    const { container } = render(<ConstellationMap
        constellation={`INTERSTELLARUM-${chartNumber}`}
        chart={interstellarumCharts[chartNumber - 1]}
        objects={[
            { name: "Bottom", ra: bottomRa, dec },
            { name: "Top", ra: topRa, dec },
        ]}
        showControls={false}
    />);
    const markers = container.querySelectorAll('line[data-marker-kind="normal"]');
    expect(markers).toHaveLength(4);
    expect(Number(markers[0].getAttribute("y1"))).toBeGreaterThan(Number(markers[2].getAttribute("y1")));
    expect(Number(markers[0].getAttribute("x1"))).toBeCloseTo(Number(markers[2].getAttribute("x1")), 6);
});
