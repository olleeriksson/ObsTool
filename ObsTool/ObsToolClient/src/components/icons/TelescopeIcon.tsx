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

type TelescopeIconVariant =
    | "bigDob"
    | "bino"
    | "dob"
    | "mak"
    | "refractor"
    | "schmidtCass"
    | "smallRefractor"
    | "tableTop"
    | "visual";

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
 * Renders one of the custom telescope SVG icons.
 */
const TelescopeIcon: React.FC<ITelescopeIconProps> = ({ variant = "tableTop", className, size = 26 }) => {
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
