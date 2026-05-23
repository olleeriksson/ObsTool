import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import Api from "../api/Api";
import { IStatistics } from "../types/Types";
import StatisticsTable from "./StatisticsTable";

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const statistics: IStatistics = {
    numObsSessions: 1,
    numObservedObjects: 1,
    numObservedGalaxies: 1,
    numObservedBrightNebulae: 0,
    numObservedDarkNebulae: 0,
    numObservedOpenClusters: 0,
    numObservedPlanetaryNebulae: 0,
    numObservedGlobularClusters: 0,
    numObservedMessierObjects: 0,
    numObservedNGCObjects: 1,
    numObservations: 1,
    numLocations: 1,
    numSketches: 0,
    numDsoInDatabase: 1,
    numDetections: 1,
    numNonDetections: 0,
    h2500: { total: 1, observed: 0, nonDetections: 0 },
    h400: { total: 0, observed: 0, nonDetections: 0 },
    constellations: [{
        constellation: "Orion",
        constellationAbbrv: "ORI",
        observed: 1,
        h2500: { total: 1, observed: 0, nonDetections: 0 },
        h400: { total: 0, observed: 0, nonDetections: 0 },
    }],
};

afterEach(() => {
    vi.restoreAllMocks();
});

it("opens the constellation dialog from a constellation statistics row", async () => {
    vi.spyOn(Api, "getStatistics").mockResolvedValue({ data: statistics } as any);
    const getObjects = vi.spyOn(Api, "getH2500ObjectsForConstellationMap").mockResolvedValue({ data: [] } as any);

    render(<StatisticsTable />, { wrapper });

    fireEvent.click(await screen.findByText("Statistics by constellation"));
    fireEvent.click(await screen.findByText("Orion"));

    await waitFor(() => expect(getObjects).toHaveBeenCalledWith("ORI"));
    expect(screen.getByText("Constellation: Orion")).toBeInTheDocument();
    expect(await screen.findByRole("checkbox", { name: "Unseen Herschel 2500" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Already observed" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Unseen Herschel 400" })).toBeInTheDocument();
});
