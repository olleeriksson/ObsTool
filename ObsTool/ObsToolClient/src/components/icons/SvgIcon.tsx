import * as React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import MuiSvgIcon, { SvgIconProps as MuiSvgIconProps } from "@mui/material/SvgIcon";
import observation1Svg from "src/assets/svg/observation1.svg";
import observation2Svg from "src/assets/svg/observation2.svg";
import observation3Svg from "src/assets/svg/observation3.svg";
import observation4Svg from "src/assets/svg/observation4.svg";
import observationChart1Svg from "src/assets/svg/observation-chart1.svg";
import observationChart2Svg from "src/assets/svg/observation-chart2.svg";
import observationChart3Svg from "src/assets/svg/observation-chart3.svg";

export type SvgIconVariant =
    | "observation1"
    | "observation2"
    | "observation3"
    | "observation4"
    | "observationChart1"
    | "observationChart2"
    | "observationChart3"
    | "observedStarChart"
    | "observedEyeCelestial";

type FileSvgIconVariant =
    | "observation1"
    | "observation2"
    | "observation3"
    | "observation4"
    | "observationChart1"
    | "observationChart2"
    | "observationChart3";
type InlineSvgIconVariant = Exclude<SvgIconVariant, FileSvgIconVariant>;

export const DEFAULT_SVG_ICON_VARIANT: SvgIconVariant = "observation1";

export const SVG_ICON_OPTIONS: Array<{ variant: SvgIconVariant; label: string }> = [
    { variant: "observation1", label: "Observation 1" },
    { variant: "observation2", label: "Observation 2" },
    { variant: "observation3", label: "Observation 3" },
    { variant: "observation4", label: "Observation 4" },
    { variant: "observationChart1", label: "Observation chart 1" },
    { variant: "observationChart2", label: "Observation chart 2" },
    { variant: "observationChart3", label: "Observation chart 3" },
    { variant: "observedStarChart", label: "Observed star chart" },
    { variant: "observedEyeCelestial", label: "Observed celestial eye" },
];

interface ISvgIconProps extends Omit<MuiSvgIconProps, "children" | "viewBox"> {
    variant: SvgIconVariant;
    size?: number;
}

const svgFileByVariant: Record<FileSvgIconVariant, string> = {
    observation1: observation1Svg,
    observation2: observation2Svg,
    observation3: observation3Svg,
    observation4: observation4Svg,
    observationChart1: observationChart1Svg,
    observationChart2: observationChart2Svg,
    observationChart3: observationChart3Svg,
};

/**
 * Confirms whether a file-backed generic SVG is one of the four plain observation assets.
 */
function isPlainObservationSvgIconVariant(variant: SvgIconVariant): variant is Extract<FileSvgIconVariant, "observation1" | "observation2" | "observation3" | "observation4"> {
    return variant === "observation1"
        || variant === "observation2"
        || variant === "observation3"
        || variant === "observation4";
}

/**
 * Confirms whether a generic icon variant is backed by an imported SVG file.
 */
function isFileSvgIconVariant(variant: SvgIconVariant): variant is FileSvgIconVariant {
    return Object.prototype.hasOwnProperty.call(svgFileByVariant, variant);
}

/**
 * Confirms that a persisted icon reference matches one of the available generic SVG variants.
 */
export function isKnownSvgIconVariant(variant?: string | null): variant is SvgIconVariant {
    return !!variant && SVG_ICON_OPTIONS.some(iconOption => iconOption.variant === variant);
}

/**
 * Returns a safe generic SVG icon variant for optional or stale persisted values.
 */
export function resolveSvgIconVariant(variant?: string | null): SvgIconVariant {
    return isKnownSvgIconVariant(variant)
        ? variant
        : DEFAULT_SVG_ICON_VARIANT;
}

/**
 * Renders reusable custom SVG icons that are not tied to DSO type classification.
 */
export function SvgIcon({ variant, size = 24, sx, ...props }: ISvgIconProps) {
    const theme = useTheme();
    const darkThemeFilter = theme.palette.mode === "dark" && isPlainObservationSvgIconVariant(variant)
        ? "invert(1)"
        : undefined;

    if (isFileSvgIconVariant(variant)) {
        return (
            <Box
                alt=""
                aria-hidden={props["aria-hidden"] ?? true}
                className={props.className}
                component="img"
                src={svgFileByVariant[variant]}
                sx={{ display: "inline-block", filter: darkThemeFilter, fontSize: size, height: size, objectFit: "contain", verticalAlign: "text-bottom", width: size, ...sx }}
            />
        );
    }

    return (
        <MuiSvgIcon
            {...props}
            inheritViewBox={false}
            sx={{ fontSize: size, ...sx }}
            viewBox="0 0 32 32"
        >
            {renderSvgIconPath(variant)}
        </MuiSvgIcon>
    );
}

/**
 * Keeps icon variants in one switch so new generic SVG glyphs can be added without changing call sites.
 */
function renderSvgIconPath(variant: InlineSvgIconVariant) {
    switch (variant) {
        case "observedStarChart":
            return (
                <>
                    <circle cx="16" cy="16" r="12.25" fill="none" stroke="currentColor" strokeWidth="2.7" />
                    <path d="M16 4v4.25M16 23.75V28M4 16h4.25M23.75 16H28" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" />
                    <path d="M9.15 8.55c3.85-2.05 9.78-2.18 13.72.18M8.8 23.1c4.2 1.7 9.7 1.7 13.8-.15" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeDasharray="4 2.6" />
                    <path d="M6.9 13.05c2.15-1.55 4.92-2.48 8.05-2.68M17.8 10.38c2.65.23 5.1 1.05 7.25 2.42" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
                    <path d="M6.85 18.85c2.22 1.52 5.02 2.38 8.1 2.52M17.72 21.3c2.85-.23 5.38-1.1 7.42-2.58" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
                    <path d="M16 10.15l1.18 3.28 3.27 1.17-3.27 1.18L16 19.05l-1.18-3.27-3.27-1.18 3.27-1.17z" fill="currentColor" />
                    <path d="M10.25 19.95l.62 1.48 1.48.62-1.48.62-.62 1.48-.62-1.48-1.48-.62 1.48-.62z" fill="currentColor" />
                    <circle cx="22.4" cy="10.4" r="1.15" fill="currentColor" />
                    <circle cx="23.4" cy="20.55" r="1.05" fill="currentColor" />
                    <circle cx="9.75" cy="12.6" r="0.9" fill="currentColor" />
                </>
            );
        case "observedEyeCelestial":
            return (
                <>
                    <path d="M3.9 16c3.1-5.15 7.15-7.72 12.1-7.72S25 10.85 28.1 16c-3.1 5.15-7.15 7.72-12.1 7.72S7 21.15 3.9 16z" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
                    <circle cx="16" cy="16" r="5.85" fill="currentColor" />
                    <path d="M18.95 11.4a5.48 5.48 0 0 0 0 9.2A5.85 5.85 0 1 1 18.95 11.4z" fill="#ffffff" />
                    <path d="M22.45 11.3l.62 1.55 1.55.62-1.55.62-.62 1.55-.62-1.55-1.55-.62 1.55-.62z" fill="#ffffff" />
                    <circle cx="20.25" cy="18.65" r="0.9" fill="#ffffff" />
                    <circle cx="17.3" cy="14.05" r="0.72" fill="#ffffff" />
                    <path d="M16 7.35v2.55M16 22.1v2.55M7.35 16H9.9M22.1 16h2.55" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M10.65 12.1c1.18-1.02 2.6-1.58 4.2-1.7M21.38 12.38c1.15.75 2.15 1.95 3.02 3.62M10.7 19.9c1.2 1.02 2.62 1.58 4.18 1.7" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </>
            );
    }
}

export default SvgIcon;
