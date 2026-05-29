import * as React from "react";
import telescopeBigDobSvg from "src/assets/svg/scope-big-dob.svg";
import telescopeBinoSvg from "src/assets/svg/scope-bino.svg";
import telescopeDobSvg from "src/assets/svg/scope-dob.svg";
import telescopeMakSvg from "src/assets/svg/scope-mak.svg";
import telescopeRefractorSvg from "src/assets/svg/scope-refractor.svg";
import telescopeTableTopSvg from "src/assets/svg/scope-tabletop.svg";
import telescopeSchmidtCassSvg from "src/assets/svg/scope-schmidt-cass.svg";
import telescopeSmallRefractorSvg from "src/assets/svg/scope-small-refractor.svg";
import telescopeVisualSvg from "src/assets/svg/scope-visual.svg";

export type TelescopeIconVariant =
    | "bigDob"
    | "bino"
    | "dob"
    | "mak"
    | "refractor"
    | "schmidtCass"
    | "smallRefractor"
    | "tableTop"
    | "visual";

export const DEFAULT_TELESCOPE_ICON_VARIANT: TelescopeIconVariant = "tableTop";

export const TELESCOPE_ICON_OPTIONS: Array<{ variant: TelescopeIconVariant; label: string }> = [
    { variant: "bigDob", label: "Big Dobsonian" },
    { variant: "bino", label: "Binoculars" },
    { variant: "dob", label: "Dobsonian" },
    { variant: "mak", label: "Maksutov" },
    { variant: "refractor", label: "Refractor" },
    { variant: "schmidtCass", label: "Schmidt-Cassegrain" },
    { variant: "smallRefractor", label: "Small refractor" },
    { variant: "tableTop", label: "Tabletop" },
    { variant: "visual", label: "Visual observing" }
];

interface ITelescopeIconProps {
    variant?: TelescopeIconVariant;
    className?: string;
    size?: number;
}

const iconByVariant: Record<TelescopeIconVariant, string> = {
    bigDob: telescopeBigDobSvg,
    bino: telescopeBinoSvg,
    dob: telescopeDobSvg,
    mak: telescopeMakSvg,
    refractor: telescopeRefractorSvg,
    schmidtCass: telescopeSchmidtCassSvg,
    smallRefractor: telescopeSmallRefractorSvg,
    tableTop: telescopeTableTopSvg,
    visual: telescopeVisualSvg
};

/**
 * Confirms that a persisted icon reference matches one of the available telescope SVG variants.
 */
export function isKnownTelescopeIconVariant(variant?: string | null): variant is TelescopeIconVariant {
    return !!variant && Object.prototype.hasOwnProperty.call(iconByVariant, variant);
}

/**
 * Returns a safe telescope icon variant for optional or stale persisted values.
 */
export function resolveTelescopeIconVariant(variant?: string | null): TelescopeIconVariant {
    return isKnownTelescopeIconVariant(variant)
        ? variant
        : DEFAULT_TELESCOPE_ICON_VARIANT;
}

/**
 * Renders one of the custom telescope SVG icons.
 */
const TelescopeIcon: React.FC<ITelescopeIconProps> = ({ variant = DEFAULT_TELESCOPE_ICON_VARIANT, className, size = 26 }) => {
    const iconSource = iconByVariant[variant];
    return (
        <img
            src={iconSource}
            alt=""
            aria-hidden="true"
            className={className}
            width={size}
            height={size}
            style={{ display: "inline-block", verticalAlign: "text-bottom" }}
        />
    );
};

export default TelescopeIcon;
