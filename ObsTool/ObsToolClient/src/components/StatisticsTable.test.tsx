import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import Api from "../api/Api";
import { IStatistics } from "../types/Types";
import { lightThemeSecondaryColor } from "../theme/ThemeColors";
import StatisticsTable from "./StatisticsTable";

const theme = createTheme({
    palette: {
        secondary: {
            main: lightThemeSecondaryColor,
        },
    },
});

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
    h2500: { total: 10, observed: 4, nonDetections: 2 },
    h400: { total: 5, observed: 3, nonDetections: 1 },
    constellations: [{
        constellation: "Orion",
        constellationAbbrv: "ORI",
        observed: 1,
        h2500: { total: 10, observed: 4, nonDetections: 2 },
        h400: { total: 5, observed: 3, nonDetections: 1 },
    }],
};

const allSessionsStatistics: IStatistics = {
    ...statistics,
    numObsSessions: 3,
    numObservedGalaxies: 3,
    numObservations: 4,
    numObservedBrightNebulae: 2,
    numObservedObjects: 5,
    numObservedOpenClusters: 1,
    numDetections: 3,
    numNonDetections: 1,
    numObservedPlanetaryNebulae: 1,
    numSketches: 2,
    numObservedGlobularClusters: 1,
    numLocations: 2,
    numObservedDarkNebulae: 1,
    numObservedMessierObjects: 2,
    numObservedNGCObjects: 3,
    h2500: { total: 10, observed: 6, nonDetections: 3 },
    h400: { total: 5, observed: 4, nonDetections: 2 },
    constellations: [{
        constellation: "Orion",
        constellationAbbrv: "ORI",
        observed: 3,
        h2500: { total: 10, observed: 6, nonDetections: 3 },
        h400: { total: 5, observed: 4, nonDetections: 2 },
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

it("reloads statistics when the session exclusion control changes", async () => {
    const getStatistics = vi.spyOn(Api, "getStatistics").mockImplementation((statsExcludeLastSessions = 0) =>
        Promise.resolve({ data: statsExcludeLastSessions > 0 ? statistics : allSessionsStatistics } as any));

    render(<StatisticsTable />, { wrapper });

    expect(await screen.findByText("All sessions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Include one more recent session" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Exclude one more recent session" }));

    expect(await screen.findByText("All but last 1 session")).toBeInTheDocument();
    await waitFor(() => expect(getStatistics).toHaveBeenCalledWith(1));
    expect(getStatistics).toHaveBeenCalledWith(0);
    expect(screen.getByRole("button", { name: "Include one more recent session" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Include one more recent session" }));

    expect(await screen.findByText("All sessions")).toBeInTheDocument();
    await waitFor(() => expect(getStatistics).toHaveBeenLastCalledWith(0));
    expect(screen.getByRole("button", { name: "Include one more recent session" })).toBeDisabled();
});

it("keeps the existing statistics table visible while reloading the session exclusion scope", async () => {
    let resolveScopedStatistics: (value: { data: IStatistics }) => void = () => undefined;
    const scopedStatisticsRequest = new Promise<{ data: IStatistics }>(resolve => {
        resolveScopedStatistics = resolve;
    });
    vi.spyOn(Api, "getStatistics").mockImplementation((statsExcludeLastSessions = 0) =>
        statsExcludeLastSessions > 0
            ? scopedStatisticsRequest as any
            : Promise.resolve({ data: allSessionsStatistics } as any));

    render(<StatisticsTable />, { wrapper });

    expect(await screen.findByText("All sessions")).toBeInTheDocument();
    expect(screen.getByText("Observing sessions")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exclude one more recent session" }));

    await screen.findByText("All but last 1 session");
    expect(screen.getByText("Observing sessions")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exclude one more recent session" })).toBeDisabled();

    resolveScopedStatistics({ data: statistics });
    await waitFor(() => expect(screen.getByRole("button", { name: "Exclude one more recent session" })).toBeEnabled());
});

it("shows blue now deltas when viewing historical statistics", async () => {
    vi.spyOn(Api, "getStatistics").mockImplementation((statsExcludeLastSessions = 0) =>
        Promise.resolve({ data: statsExcludeLastSessions > 0 ? statistics : allSessionsStatistics } as any));

    render(<StatisticsTable />, { wrapper });

    fireEvent.click(await screen.findByRole("button", { name: "Exclude one more recent session" }));

    expect(await screen.findByText("All but last 1 session")).toBeInTheDocument();
    expect(screen.queryAllByText("(now)")).toHaveLength(0);

    const sessionRow = screen.getByRole("row", { name: "Observing sessions 1 +2 Observed Galaxies 1 +2" });
    expect(within(sessionRow).getAllByText("+2")).toHaveLength(2);
    expect(within(sessionRow).getAllByText("+2")[0]).toHaveStyle({ color: theme.palette.secondary.main });

    const h2500Row = screen.getByRole("row", { name: "Observed H2500 objects 4 / 10(40%) +2(+20%) Observed H400 objects 3 / 5(60%) +1(+20%)" });
    expect(within(h2500Row).getByText("+2")).toHaveStyle({ color: theme.palette.secondary.main });
    expect(within(h2500Row).getAllByText("(+20%)")).toHaveLength(2);

    const failedRow = screen.getByRole("row", { name: "Unsuccessfull H2500 objects 2 +1 Unsuccessfull H400 objects 1 +1" });
    expect(within(failedRow).getAllByText("+1")).toHaveLength(2);

    fireEvent.click(screen.getByText("Statistics by constellation"));

    await waitFor(() => expect(screen.getAllByText("(now)")).toHaveLength(3));
    const constellationRow = screen.getByRole("row", { name: "Orion 1 +2 3(+1) / 5(60%) +1 (+1)(+20%) 4(+2) / 10(40%) +2 (+1)(+20%)" });
    expect(within(constellationRow).getAllByText("+2").length).toBeGreaterThan(0);
});

it("shows updated object statistics labels and tooltips", async () => {
    vi.spyOn(Api, "getStatistics").mockResolvedValue({ data: statistics } as any);
    const user = userEvent.setup();

    render(<StatisticsTable />, { wrapper });

    expect(await screen.findByText("Observing sessions")).toBeInTheDocument();
    expect(screen.queryByText("Recorded observations")).not.toBeInTheDocument();
    expect(screen.queryByText("Detections (non-detections)")).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: "All objects attempted 1 Observed Bright Nebulae 0" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "Observed objects 1 Observed Open Clusters 0" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "Unsuccessfully observed 0 Observed Planetary Nebulae 0" })).toBeInTheDocument();

    await user.hover(screen.getByText("All objects attempted"));
    expect(await screen.findByText("All objects ever observed or attempted.")).toBeInTheDocument();

    await user.hover(screen.getByText("Observed objects"));
    expect(await screen.findByText("All objects attempted and successfully observed at least once.")).toBeInTheDocument();

    await user.hover(screen.getByText("Unsuccessfully observed"));
    expect(await screen.findByText("All objects attempted but never successfully observed.")).toBeInTheDocument();
});

it("shows failed H2500 and H400 attempts on their own row", async () => {
    vi.spyOn(Api, "getStatistics").mockResolvedValue({ data: statistics } as any);

    render(<StatisticsTable />, { wrapper });

    expect(await screen.findByText("Observed H2500 objects")).toBeInTheDocument();
    expect(screen.getByText(/4 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText("(40%)")).toBeInTheDocument();
    expect(screen.getByText("Observed H400 objects")).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 5/)).toBeInTheDocument();
    expect(screen.getByText("(60%)")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "Unsuccessfull H2500 objects 2 Unsuccessfull H400 objects 1" })).toBeInTheDocument();
    expect(screen.queryByText("(+2)")).not.toBeInTheDocument();
    expect(screen.queryByText("(+1)")).not.toBeInTheDocument();
});
