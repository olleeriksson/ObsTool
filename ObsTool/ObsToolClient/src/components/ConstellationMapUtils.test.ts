import {
    formatMapObjectLabel,
    parseDecToDegrees,
    parseRaToLongitude,
    projectToTangentPlane,
    ProjectedLabelCandidate,
    selectLabelPlacements,
} from "./ConstellationMapUtils";

function candidate(key: string, longitude: number, latitude: number, x: number, y: number): ProjectedLabelCandidate {
    return {
        key,
        label: key,
        longitude,
        latitude,
        planeX: x,
        planeY: y,
        x,
        y,
        markerRadius: 4,
    };
}

it("parses SAC-style RA and DEC coordinates", () => {
    expect(parseRaToLongitude("00 42.7")).toBeCloseTo(10.675, 3);
    expect(parseRaToLongitude("13 50.0")).toBeCloseTo(-152.5, 3);
    expect(parseDecToDegrees("+41 16")).toBeCloseTo(41.267, 3);
    expect(parseDecToDegrees("-00 52")).toBeCloseTo(-0.867, 3);
});

it("projects increasing RA to the left side of the map", () => {
    const projected = projectToTangentPlane({ longitude: 10, latitude: 80 }, 0, 80);

    expect(projected).not.toBeNull();
    expect(projected!.planeX).toBeLessThan(0);
});

it("formats SAC and Herschel labels", () => {
    expect(formatMapObjectLabel({ name: "M 51", catalog: "M", catalogNumber: "51", ra: "00 00", dec: "+00 00" }, "sac")).toBe("M51");
    expect(formatMapObjectLabel({ name: "NGC 981", catalog: "NGC", catalogNumber: "981", ra: "00 00", dec: "+00 00" }, "sac")).toBe("NGC 981");
    expect(formatMapObjectLabel({ name: "NGC 981", herschelNo: "H I-1", ra: "00 00", dec: "+00 00" }, "herschel")).toBe("H I-1");
});

it("uses highlighted label budget before normal objects", () => {
    const labels = selectLabelPlacements(
        [candidate("highlighted", 0, 0, 100, 100)],
        [candidate("normal", 90, 0, 900, 100)],
        1,
        12,
        1000,
        400);

    expect(labels.map(label => label.key)).toEqual(["highlighted"]);
});

it("spreads labels apart when not every highlighted object can be labeled", () => {
    const labels = selectLabelPlacements(
        [
            candidate("near-a", 0, 0, 100, 100),
            candidate("near-b", 1, 0, 130, 100),
            candidate("far", 10, 0, 600, 100),
        ],
        [],
        2,
        12,
        1000,
        400);

    expect(labels.map(label => label.key)).toEqual(["far", "near-a"]);
});

it("keeps a small label budget collision-free when boxes overlap", () => {
    const labels = selectLabelPlacements(
        [
            candidate("same-a", 0, 0, 100, 100),
            candidate("same-b", 0.01, 0, 102, 100),
        ],
        [],
        1,
        12,
        1000,
        400);

    expect(labels).toHaveLength(1);
});

it("fills the requested label budget with the least-overlapping labels", () => {
    const labels = selectLabelPlacements(
        [
            candidate("same-a", 0, 0, 100, 100),
            candidate("same-b", 0.01, 0, 102, 100),
            candidate("far", 10, 0, 600, 100),
        ],
        [],
        3,
        12,
        1000,
        400);

    expect(labels.map(label => label.key)).toEqual(["far", "same-a", "same-b"]);
});

it("does not clamp offscreen labels onto the edge of the view", () => {
    const labels = selectLabelPlacements(
        [
            candidate("off-left", 0, 0, -20, 100),
            candidate("off-right", 0, 0, 1020, 100),
            candidate("off-top", 0, 0, 500, -20),
            candidate("off-bottom", 0, 0, 500, 420),
            candidate("visible", 0, 0, 500, 100),
        ],
        [],
        3,
        11,
        1000,
        400,
        true);

    expect(labels.map(label => label.key)).toEqual(["visible"]);
});
