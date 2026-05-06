import * as React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import HerschelBadge from "./HerschelBadge";
import { IHerschelInfo } from "../types/Types";

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const h400Object: IHerschelInfo = {
    herschelId: 1,
    herschelNo: "H I-1",
    h400: true,
};

it("shows H400 overlay for a single H400 Herschel object", () => {
    render(<HerschelBadge herschelObjects={[h400Object]} />, { wrapper });

    expect(screen.getByText("H400")).toBeInTheDocument();
    expect(screen.getByText("HERSCHEL")).toBeInTheDocument();
});

it("shows H400.. overlay and generic Herschel label for multiple rows when the first row is H400", () => {
    render(<HerschelBadge herschelObjects={[h400Object, { herschelId: 2, herschelNo: "H II-2", h400: false }]} />, { wrapper });

    expect(screen.getByText("H400..")).toBeInTheDocument();
    expect(screen.getByText("HERSCHEL")).toBeInTheDocument();
});

it("shows generic Herschel label without H400 overlay when the first row is not H400", () => {
    render(<HerschelBadge herschelObjects={[{ ...h400Object, h400: false }, { herschelId: 2, herschelNo: "H II-2", h400: false }]} />, { wrapper });

    expect(screen.getByText("HERSCHEL")).toBeInTheDocument();
    expect(screen.queryByText("H400..")).not.toBeInTheDocument();
});

it("does not show H400 overlay when only a hidden later row is H400", () => {
    render(<HerschelBadge herschelObjects={[{ ...h400Object, h400: false }, { herschelId: 2, herschelNo: "H II-2", h400: true }]} />, { wrapper });

    expect(screen.getByText("HERSCHEL")).toBeInTheDocument();
    expect(screen.queryByText("H400..")).not.toBeInTheDocument();
});
