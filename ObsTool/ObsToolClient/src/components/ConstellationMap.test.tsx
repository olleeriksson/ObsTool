import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ConstellationMap from "./ConstellationMap";

it("does not label a single foreground object", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[{ name: "NGC 224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" }]}
            labelMode="herschel"
        />
    );

    expect(screen.queryByText("H V-18")).not.toBeInTheDocument();
});

it("does not label background objects", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[]}
            backgroundObjects={[
                { name: "NGC 224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" },
                { name: "NGC 205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" },
            ]}
            labelMode="herschel"
            maxNumLabels={10}
        />
    );

    expect(screen.queryByText("H V-18")).not.toBeInTheDocument();
    expect(screen.queryByText("H V-17")).not.toBeInTheDocument();
});

it("defaults label count to every foreground object when maxNumLabels is omitted", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[{ name: "NGC 205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" }]}
            highlightedObjects={[{ name: "NGC 224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" }]}
            backgroundObjects={[{ name: "NGC 206", herschelNo: "H V-16", ra: "00 40.5", dec: "+40 44" }]}
            labelMode="herschel"
        />
    );

    expect(screen.getByText("H V-17")).toBeInTheDocument();
    expect(screen.getByText("H V-18")).toBeInTheDocument();
    expect(screen.queryByText("H V-16")).not.toBeInTheDocument();
    expect(screen.getByText("Label count: 2")).toBeInTheDocument();
});

it("defaults label count to normal objects when there are no highlighted objects", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[
                { name: "NGC 205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" },
                { name: "NGC 221", herschelNo: "H V-19", ra: "00 42.7", dec: "+40 52" },
            ]}
            backgroundObjects={[{ name: "NGC 206", herschelNo: "H V-16", ra: "00 40.5", dec: "+40 44" }]}
            labelMode="herschel"
        />
    );

    expect(screen.getByText("H V-17")).toBeInTheDocument();
    expect(screen.getByText("H V-19")).toBeInTheDocument();
    expect(screen.queryByText("H V-16")).not.toBeInTheDocument();
    expect(screen.getByText("Label count: 2")).toBeInTheDocument();
});

it("renders a label style toggle and label count", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[
                { name: "NGC 224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" },
                { name: "NGC 205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" },
            ]}
            labelMode="herschel"
        />
    );

    expect(screen.getByRole("button", { name: "Herschel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SAC" })).toBeInTheDocument();
    expect(screen.getByText(/Label count:/)).toBeInTheDocument();
});

it("shows selected object information when a label is clicked", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[
                { name: "NGC 224", catalog: "NGC", catalogNumber: "224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" },
                { name: "NGC 205", catalog: "NGC", catalogNumber: "205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" },
            ]}
            labelMode="herschel"
        />
    );

    fireEvent.click(screen.getByText("H V-18"));

    expect(screen.getByText("NGC 224 / H V-18")).toBeInTheDocument();
});

it("zooms from the wheel when zooming is enabled", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[]}
            initialZoom={2}
        />
    );

    const map = screen.getByRole("img", { name: "Constellation map" });
    vi.spyOn(map, "getBoundingClientRect").mockReturnValue({
        bottom: 420,
        height: 420,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });

    fireEvent.wheel(map, { clientX: 250, clientY: 200, deltaY: 100 });

    expect(screen.getByText("Zoom: 1.8x")).toBeInTheDocument();
});

it("ignores wheel zoom when zooming is disabled", () => {
    render(
        <ConstellationMap
            constellation="And"
            objects={[]}
            initialZoom={2}
            allowZoom={false}
        />
    );

    const map = screen.getByRole("img", { name: "Constellation map" });
    vi.spyOn(map, "getBoundingClientRect").mockReturnValue({
        bottom: 420,
        height: 420,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });

    fireEvent.wheel(map, { clientX: 250, clientY: 200, deltaY: 100 });

    expect(screen.getByText("Zoom: 2.0x")).toBeInTheDocument();
});

it("clips the white constellation fill to the focused boundary", () => {
    const { container } = render(
        <ConstellationMap
            constellation="And"
            objects={[]}
        />
    );

    const clipPath = container.querySelector("clipPath");
    const clippedFill = container.querySelector("rect[clip-path]");

    expect(clipPath).toBeInTheDocument();
    expect(clippedFill).toHaveAttribute("fill", "#ffffff");
});
