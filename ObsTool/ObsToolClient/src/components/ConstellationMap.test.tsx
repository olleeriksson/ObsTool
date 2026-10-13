import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { labelVisibilityStorageKey } from "../store/LabelVisibilityStore";
import ConstellationMap from "./ConstellationMap";
import ConstellationView from "./ConstellationView";

// Isolate persisted global preferences between scenarios.
beforeEach(() => {
    localStorage.removeItem(labelVisibilityStorageKey);
    window.dispatchEvent(new StorageEvent("storage", { key: labelVisibilityStorageKey }));
});

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

it("toggles each marker type from the controls panel", () => {
    const { container } = render(
        <ConstellationMap
            constellation="And"
            objects={[{ name: "NGC 205", herschelNo: "H V-17", ra: "00 40.4", dec: "+41 41" }]}
            backgroundObjects={[{ name: "NGC 206", herschelNo: "H V-16", ra: "00 40.5", dec: "+40 44" }]}
            highlightedObjects={[{ name: "NGC 224", herschelNo: "H V-18", ra: "00 42.7", dec: "+41 16" }]}
            objectLabel="Unseen Herschel 2500"
            backgroundLabel="Already observed"
            highlightedLabel="Unseen Herschel 400"
            labelMode="herschel"
        />
    );

    expect(container.querySelectorAll("line[data-marker-kind='background']")).toHaveLength(2);
    expect(container.querySelectorAll("line[data-marker-kind='normal']")).toHaveLength(2);
    expect(container.querySelectorAll("line[data-marker-kind='highlighted']")).toHaveLength(2);

    fireEvent.click(screen.getByRole("checkbox", { name: "Already observed" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 2500" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 400" }));

    expect(container.querySelectorAll("line[data-marker-kind='background']")).toHaveLength(0);
    expect(container.querySelectorAll("line[data-marker-kind='normal']")).toHaveLength(0);
    expect(container.querySelectorAll("line[data-marker-kind='highlighted']")).toHaveLength(0);

    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 2500" }));

    expect(container.querySelectorAll("line[data-marker-kind='normal']")).toHaveLength(2);
});

// Exercise the shared toggle path, default-placement fallback, and persistent preferences.
it("toggles labels through markers and labels and preserves hidden choices while disabled", () => {
    const { container, rerender } = render(
        <ConstellationMap
            constellation="And"
            objects={[{ name: "NGC 224", herschelId: 1, ra: "00 42.7", dec: "+41 16" }]}
            highlightedObjects={[{ name: "NGC 205", herschelId: 2, ra: "00 40.4", dec: "+41 41" }]}
            backgroundObjects={[{ name: "NGC 206", herschelId: 3, ra: "00 40.5", dec: "+40 44" }]}
            showBackgroundLabels={true}
            labelSingleObject={true}
            enableLabelVisibilityFilter={true}
        />
    );
    const labels = () => container.querySelectorAll("svg text");
    expect(labels()).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(labels()).toHaveLength(0);
    expect(container.querySelectorAll("line[data-marker-kind]")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(labels()).toHaveLength(3);
    fireEvent.click(container.querySelector("svg text")!);
    expect(labels()).toHaveLength(2);
    fireEvent.click(container.querySelector("line[data-marker-kind='highlighted']")!);
    expect(labels()).toHaveLength(3);

    const map = screen.getByRole("img", { name: "Constellation map" });
    const capturePointer = vi.fn();
    Object.defineProperty(map, "setPointerCapture", { value: capturePointer });
    const backgroundHitArea = container.querySelector("line[data-marker-kind='background']")!.parentElement!.querySelector("circle")!;
    fireEvent.pointerDown(backgroundHitArea, { button: 0, isPrimary: true, pointerId: 1 });
    expect(capturePointer).not.toHaveBeenCalled();
    fireEvent.click(backgroundHitArea);
    fireEvent.click(container.querySelector("line[data-marker-kind='normal']")!);
    expect(labels()).toHaveLength(1);
    expect(container.querySelectorAll("line[data-marker-kind]")).toHaveLength(6);
    expect(container.querySelector("aside")).not.toHaveTextContent("NGC 224");
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(labels()).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(labelVisibilityStorageKey)!).hiddenByConstellation.AND.sort()).toEqual(["h-1", "h-2", "h-3"]);
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(labels()).toHaveLength(3);
    fireEvent.click(backgroundHitArea);
    fireEvent.click(container.querySelector("line[data-marker-kind='normal']")!);
    expect(labels()).toHaveLength(1);

    fireEvent.click(screen.getByRole("switch", { name: "Label visibility filter" }));
    expect(labels()).toHaveLength(3);
    fireEvent.click(backgroundHitArea);
    const persisted = JSON.parse(localStorage.getItem(labelVisibilityStorageKey)!);
    expect(screen.getByRole("button", { name: "Toggle labels" })).toBeDisabled();
    expect(persisted.enabled).toBe(false);
    expect(persisted.hiddenByConstellation.AND.sort()).toEqual(["h-1", "h-3"]);
    fireEvent.click(screen.getByRole("switch", { name: "Label visibility filter" }));
    expect(labels()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Reset labels" }));
    expect(labels()).toHaveLength(3);

    fireEvent.click(backgroundHitArea);
    rerender(<ConstellationMap constellation="UMI" objects={[]} enableLabelVisibilityFilter={true} />);
    expect(screen.getByRole("switch", { name: "Label visibility filter" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Reset labels" }));
    expect(JSON.parse(localStorage.getItem(labelVisibilityStorageKey)!).hiddenByConstellation.AND).toEqual(["h-3"]);
    // Reloading the persisted snapshot must retain hidden choices across page loads.
    window.dispatchEvent(new StorageEvent("storage", { key: labelVisibilityStorageKey }));
    expect(JSON.parse(localStorage.getItem(labelVisibilityStorageKey)!).hiddenByConstellation.AND).toEqual(["h-3"]);
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
    expect(clippedFill).toHaveAttribute("data-map-layer", "focused-fill");
});

// Resize the real plot observer and verify that shrinking the map removes grid lines.
it("fits the SVG and grid density to the measured plot viewport", async () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    let resizeObserver: MockResizeObserver | undefined;

    class MockResizeObserver {
        private readonly callback: ResizeObserverCallback;

        // Retain the live observer so this test can simulate viewport changes.
        public constructor(callback: ResizeObserverCallback) {
            resizeObserver = this;
            this.callback = callback;
        }

        // Supply the initial measured width when the plot is mounted.
        public observe() {
            this.resize(640);
        }

        // Notify the same observer when the plot shrinks.
        public resize(width: number) {
            this.callback([{ contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry], this as unknown as ResizeObserver);
        }

        public unobserve() {
        }

        public disconnect() {
        }
    }

    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    try {
        render(
            <ConstellationMap
                constellation="And"
                objects={[]}
                height={500}
                showControls={false}
            />
        );

        const map = screen.getByRole("img", { name: "Constellation map" });

        await waitFor(() => expect(map).toHaveAttribute("viewBox", "0 0 640 500"));
        expect(map.querySelector("rect[data-map-layer='background']")).toHaveAttribute("width", "640");
        const initialGridLines = map.querySelectorAll("path[class*=gridLine]").length;
        expect(initialGridLines).toBeGreaterThan(0);
        act(() => resizeObserver!.resize(240));
        expect(map).toHaveAttribute("viewBox", "0 0 240 500");
        expect(map.querySelectorAll("path[class*=gridLine]").length).toBeLessThan(initialGridLines);
    } finally {
        globalThis.ResizeObserver = originalResizeObserver;
    }
});
// Verify that detection status takes precedence over H400 membership in the dialog's map filters.
it("labels every statistics group with SAC names and keeps observed H400 objects out of unseen groups", () => {
    const { container } = render(
        <ConstellationView
            constellationAbbrv="UMI"
            constellationName="Ursa Minor"
            objects={[
                { name: "NGC 6217", herschelNo: "H I-280", ra: "16 32.7", dec: "+78 12", h400: true, isObserved: true },
                { name: "Unseen H400", ra: "16 00", dec: "+78 00", h400: true, isObserved: false },
                { name: "Unseen H2500", ra: "15 00", dec: "+78 00", h400: false, isObserved: false },
            ]}
            objectLabel="Unseen Herschel 2500"
            backgroundLabel="Already observed"
            highlightedLabel="Unseen Herschel 400"
        />
    );

    expect(screen.getByRole("checkbox", { name: "NGC 6217 observed", hidden: true })).toBeChecked();
    const labelSelector = screen.getByRole("group", { name: "Constellation map label style" });
    expect(labelSelector.querySelector("button")).toHaveTextContent("SAC");
    expect(screen.getByRole("button", { name: "SAC" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll("svg text")).toHaveLength(3);
    expect(screen.getByText("Label count: 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 2500" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 400" }));
    expect(container.querySelectorAll("line[data-marker-kind='background']")).toHaveLength(2);
    const observedLabel = container.querySelector("svg text")!;
    const observedMarker = container.querySelector("line[data-marker-kind='background']")!;
    expect(observedLabel).toHaveTextContent("NGC 6217");
    expect(getComputedStyle(observedLabel).fill).toBe(getComputedStyle(observedMarker).stroke);
    expect(container.querySelectorAll("svg text")).toHaveLength(1);
    expect(container.querySelectorAll("line[data-marker-kind='normal']")).toHaveLength(0);
    expect(container.querySelectorAll("line[data-marker-kind='highlighted']")).toHaveLength(0);

    fireEvent.click(screen.getByRole("checkbox", { name: "Already observed" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 400" }));
    expect(container.querySelectorAll("line[data-marker-kind='background']")).toHaveLength(0);
    expect(container.querySelectorAll("line[data-marker-kind='highlighted']")).toHaveLength(2);
    expect(container.querySelector("svg text")).toHaveTextContent("Unseen H400");
    expect(container.querySelectorAll("svg text")).toHaveLength(1);
    expect(container.querySelector("line[data-marker-kind='highlighted']")).toHaveAttribute("stroke-width", "3");
    // Group colors must match their markers without competing with shared typography.
    expect(getComputedStyle(container.querySelector("svg text")!).fill).toBe(
        getComputedStyle(container.querySelector("line[data-marker-kind='highlighted']")!).stroke);

    fireEvent.click(screen.getByRole("button", { name: "Herschel" }));
    expect(screen.getByRole("button", { name: "Herschel" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 400" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 2500" }));
    expect(container.querySelectorAll("svg text")).toHaveLength(1);
    expect(container.querySelector("svg text")).toHaveTextContent("Unseen H2500");
    expect(getComputedStyle(container.querySelector("svg text")!).fill).toBe(
        getComputedStyle(container.querySelector("line[data-marker-kind='normal']")!).stroke);
});

// Bulk toggling follows marker groups, normalizes mixed selections, and leaves other groups intact.
it("hides or restores all labels only in checked marker groups", () => {
    const { container } = render(<ConstellationMap
        constellation="And"
        objects={[{ name: "Normal", herschelId: 1, ra: "00 40.4", dec: "+41 41" }]}
        backgroundObjects={[{ name: "Observed", herschelId: 2, ra: "00 40.5", dec: "+40 44" }]}
        highlightedObjects={[
            { name: "H400 A", herschelId: 3, ra: "00 42.7", dec: "+41 16" },
            { name: "H400 B", herschelId: 4, ra: "00 43.7", dec: "+41 26" },
        ]}
        objectLabel="Unseen Herschel 2500" backgroundLabel="Already observed" highlightedLabel="Unseen Herschel 400"
        showBackgroundLabels={true} labelSingleObject={true} enableLabelVisibilityFilter={true}
    />);
    const hiddenKeys = () => JSON.parse(localStorage.getItem(labelVisibilityStorageKey)!).hiddenByConstellation.AND.sort();
    fireEvent.click(container.querySelector("line[data-marker-kind='normal']")!);
    fireEvent.click(container.querySelector("line[data-marker-kind='highlighted']")!);
    fireEvent.click(screen.getByRole("checkbox", { name: "Already observed" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 2500" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(hiddenKeys()).toEqual(["h-1", "h-3", "h-4"]);
    expect(container.querySelectorAll("svg text")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(hiddenKeys()).toEqual(["h-1"]);
    expect(container.querySelectorAll("svg text")).toHaveLength(2);
    fireEvent.click(screen.getByRole("checkbox", { name: "Unseen Herschel 400" }));
    expect(screen.getByRole("button", { name: "Toggle labels" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Already observed" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(hiddenKeys()).toEqual(["h-1", "h-2"]);
    fireEvent.click(screen.getByRole("button", { name: "Toggle labels" }));
    expect(hiddenKeys()).toEqual(["h-1"]);
});
