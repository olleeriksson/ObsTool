import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, vi, it, expect } from "vitest";
import Api from "../api/Api";
import ConstellationLabelStatus, { ConstellationLabelStatusHeader, classifyDeclinationBounds, getConstellationVisibility } from "./ConstellationLabelStatus";
import { labelVisibilityStorageKey, setLabelVisibilityEnabled, toggleHiddenLabel } from "../store/LabelVisibilityStore";

// Start each status scenario from empty persisted preferences.
beforeEach(() => {
    localStorage.removeItem(labelVisibilityStorageKey);
    window.dispatchEvent(new StorageEvent("storage", { key: labelVisibilityStorageKey }));
});
afterEach(() => { vi.restoreAllMocks(); });

// Check both exact horizon boundaries and representative bundled constellation bounds.
it("classifies declination boxes by whether their entire range can rise at 55.3 north", () => {
    const limit = 55.3 - 90;
    expect(classifyDeclinationBounds(limit + 0.01, 20)).toBe("full");
    expect(classifyDeclinationBounds(limit, 20)).toBe("partial");
    expect(classifyDeclinationBounds(-70, limit)).toBe("never");
    expect(getConstellationVisibility("UMI")).toBe("full");
    expect(getConstellationVisibility("CEN")).toBe("partial");
    expect(getConstellationVisibility("CHA")).toBe("never");
});

// Test completion against every catalog identity, global toggling, and each visibility-specific color.
it("shows the requested status icons only with the global filter enabled", async () => {
    vi.spyOn(Api, "getH2500ObjectsForConstellationMap").mockResolvedValue({ data: [
        { name: "First", herschelId: 1, ra: "00 00", dec: "+40 00" },
        { name: "Second", herschelId: 2, ra: "00 00", dec: "+40 00" },
    ] } as any);
    render(<table><thead><tr><ConstellationLabelStatusHeader /></tr></thead><tbody><tr>
        <ConstellationLabelStatus constellation="UMI" total={2} />
        <ConstellationLabelStatus constellation="CEN" total={2} />
        <ConstellationLabelStatus constellation="CHA" total={2} />
    </tr></tbody></table>);
    expect(screen.getByRole("columnheader", { name: "Label visibility status" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /UMI/ })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /CEN.*labels remaining/ })).toHaveStyle({ color: "#d3d3d3" });
    expect(screen.getByRole("img", { name: /CHA.*labels remaining/ })).toHaveStyle({ color: "#d3d3d3" });
    expect(screen.getByTestId("EllipsisIcon")).toBeInTheDocument();
    expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    act(() => { for (const con of ["UMI", "CEN", "CHA"]) { toggleHiddenLabel(con, "h-1"); } });
    await waitFor(() => expect(screen.getAllByTestId("CheckBoxOutlineBlankIcon")).toHaveLength(3));
    expect(screen.getByRole("img", { name: /UMI.*some Herschel labels hidden/ })).toHaveStyle({ color: "#4f8532" });
    expect(screen.getByRole("img", { name: /CEN.*some Herschel labels hidden/ })).toHaveStyle({ color: "#d3d3d3" });
    expect(screen.getByRole("img", { name: /CHA.*some Herschel labels hidden/ })).toHaveStyle({ color: "#000000" });
    expect(screen.queryByTestId("EllipsisIcon")).not.toBeInTheDocument();
    act(() => { for (const con of ["UMI", "CEN", "CHA"]) { toggleHiddenLabel(con, "h-2"); } });
    expect(screen.getByRole("img", { name: /UMI.*all Herschel labels hidden/ })).toHaveStyle({ color: "#4f8532" });
    expect(screen.getByRole("img", { name: /CEN.*all Herschel labels hidden/ })).toHaveStyle({ color: "#d3d3d3" });
    expect(screen.getByRole("img", { name: /CHA.*all Herschel labels hidden/ })).toHaveStyle({ color: "#000000" });
    expect(screen.getAllByTestId("CheckBoxIcon")).toHaveLength(3);
    act(() => { setLabelVisibilityEnabled(false); });
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
    act(() => { setLabelVisibilityEnabled(true); });
    await waitFor(() => expect(screen.getAllByTestId("CheckBoxIcon")).toHaveLength(3));
    act(() => {
        for (const con of ["UMI", "CEN", "CHA"]) {
            toggleHiddenLabel(con, "h-1");
            toggleHiddenLabel(con, "h-2");
            toggleHiddenLabel(con, "h-stale");
        }
    });
    expect(screen.queryByTestId("CheckBoxOutlineBlankIcon")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /UMI/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("EllipsisIcon")).toBeInTheDocument();
});

// Empty Herschel lists are incomplete irrespective of sky visibility or saved filter entries.
it("shows a red cross for constellations without Herschel objects", () => {
    act(() => { toggleHiddenLabel("CRA", "h-1"); });
    const getObjects = vi.spyOn(Api, "getH2500ObjectsForConstellationMap");
    render(<table><tbody><tr>
        <ConstellationLabelStatus constellation="CRA" total={0} />
        <ConstellationLabelStatus constellation="UMI" total={0} />
        <ConstellationLabelStatus constellation="CEN" total={0} />
    </tr></tbody></table>);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    for (const icon of screen.getAllByRole("img")) {
        expect(icon).toHaveAccessibleName(/no Herschel objects/);
        expect(icon).toHaveStyle({ color: "#d32f2f" });
    }
    expect(screen.getAllByTestId("CloseIcon")).toHaveLength(3);
    expect(screen.queryByTestId("CheckBoxIcon")).not.toBeInTheDocument();
    expect(getObjects).not.toHaveBeenCalled();
});
