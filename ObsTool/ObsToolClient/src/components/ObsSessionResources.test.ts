import { describe, expect, it } from "vitest";
import { IObsSession } from "../types/Types";
import { updateObservationResources } from "./ObsSessionResources";

describe("updateObservationResources", () => {
    it("replaces the resources for the saved observation without changing other observations", () => {
        const session: IObsSession = {
            id: 1,
            date: "2026-05-24",
            observations: [
                {
                    id: 10,
                    dsoObservations: [],
                    text: "M 1",
                    obsResources: [],
                    displayOrder: 1,
                    nonDetection: false,
                },
                {
                    id: 20,
                    dsoObservations: [],
                    text: "M 2",
                    obsResources: [{ id: 7, type: "image", url: "old.jpg", inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 0 }],
                    displayOrder: 2,
                    nonDetection: false,
                },
            ],
        };

        const updated = updateObservationResources(session, 10, [
            { id: 8, type: "sketch", url: "drive-id", inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 255 },
        ]);

        expect(updated).not.toBe(session);
        expect(updated.observations?.[0].obsResources).toEqual([
            { id: 8, type: "sketch", url: "drive-id", inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 255 },
        ]);
        expect(updated.observations?.[1]).toBe(session.observations?.[1]);
    });

    it("returns the same session when the observation is not in the current snapshot", () => {
        const session: IObsSession = {
            id: 1,
            date: "2026-05-24",
            observations: [],
        };

        expect(updateObservationResources(session, 999, [])).toBe(session);
    });
});
