import * as React from "react";
import telescope1Svg from "src/assets/svg/telescope1.svg";
import telescope2Svg from "src/assets/svg/telescope2.svg";

type TelescopeIconVariant = "telescope1" | "telescope2";

interface ITelescopeIconProps {
    variant?: TelescopeIconVariant;
    className?: string;
    size?: number;
}

const iconByVariant: Record<TelescopeIconVariant, string> = {
    telescope1: telescope1Svg,
    telescope2: telescope2Svg
};

/**
 * Renders one of the custom telescope SVG icons.
 */
const TelescopeIcon: React.FC<ITelescopeIconProps> = ({ variant = "telescope1", className, size = 26 }) => {
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
