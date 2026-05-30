import * as React from "react";
import { getDsoTypeIconVariant } from "../utils/objectIcons";

interface IDsoTypeIconProps {
    className?: string;
    size?: number;
    type?: string | null;
}

export type UndefinedObjectIconCandidate =
    "sparkleGroup" |
    "starDisc" |
    "markedStar";

export const UNDEFINED_OBJECT_ICON_CANDIDATES: Array<{ key: UndefinedObjectIconCandidate; label: string }> = [
    { key: "sparkleGroup", label: "Sparkle group" },
    { key: "starDisc", label: "Star disc" },
    { key: "markedStar", label: "Marked star" },
];

const STAR_PATH = "M0 -5 L1.4 -1.6 L5 -1.5 L2.1 .7 L3.1 4.2 L0 2.2 L-3.1 4.2 L-2.1 .7 L-5 -1.5 L-1.4 -1.6 Z";
const SPARKLE_PATH = "M0 -6 C0.8 -2.2 2.2 -0.8 6 0 C2.2 0.8 0.8 2.2 0 6 C-0.8 2.2 -2.2 0.8 -6 0 C-2.2 -0.8 -0.8 -2.2 0 -6 Z";
const STAR_FILL = "#ffffff";
const STAR_STROKE = "#1f2933";
const ICON_VIEWBOX_Y_OFFSET = 0.75;
const ICON_INLINE_STYLE: React.CSSProperties = {
    display: "inline-block",
    verticalAlign: "middle",
};

// Renders original inline SVG glyphs kept close to common clean deep-sky chart symbols.
export function DsoTypeIcon({ className, size = 22, type }: IDsoTypeIconProps) {
    const variant = getDsoTypeIconVariant(type);
    const commonProps = {
        "aria-hidden": true,
        className,
        "data-dso-type-icon": variant,
        focusable: "false",
        height: size,
        style: ICON_INLINE_STYLE,
        viewBox: `0 ${ICON_VIEWBOX_Y_OFFSET} 24 24`,
        width: size,
    } as const;

    switch (variant) {
        case "asterism":
            return (
                <svg {...commonProps}>
                    <path d="M7 15.5l4.2-6.7 5.8 3.2-3.6 4.5z" fill="none" stroke="#465462" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2.2 1.9" />
                    <circle cx="7" cy="15.5" r="1.35" fill="#465462" />
                    <circle cx="11.2" cy="8.8" r="1.35" fill="#465462" />
                    <circle cx="17" cy="12" r="1.35" fill="#465462" />
                    <circle cx="13.4" cy="16.5" r="1.35" fill="#465462" />
                </svg>
            );
        case "brightNebula":
            return (
                <svg {...commonProps}>
                    <rect x="7" y="7" width="10" height="10" rx="0.9" fill="#dff3e3" stroke="#1f7a33" strokeWidth="1.45" />
                </svg>
            );
        case "darkNebula":
            return (
                <svg {...commonProps}>
                    <rect x="7.2" y="7.2" width="9.6" height="9.6" rx="0.8" fill="#b7bcc1" stroke="#343b42" strokeWidth="1.2" strokeDasharray="2.2 1.9" />
                </svg>
            );
        case "clusterNebula":
            return (
                <svg {...commonProps}>
                    <circle cx="10.3" cy="10.2" r="6.3" fill="#fff08a" stroke="#5f4931" strokeWidth="1.35" strokeDasharray="1.5 2" />
                    <rect x="9.4" y="9.4" width="9.8" height="9.8" rx="0.85" fill="#dff3e3" stroke="#1f7a33" strokeWidth="1.35" />
                </svg>
            );
        case "galaxy":
            return (
                <svg {...commonProps}>
                    <ellipse cx="12" cy="12" rx="8" ry="4.3" transform="rotate(25 12 12)" fill="#b9dcf6" stroke="#0f68b8" strokeWidth="1.65" />
                </svg>
            );
        case "galaxyDiffuseNebula":
            return (
                <svg {...commonProps}>
                    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(25 12 12)" fill="#dcecf9" stroke="#0f68b8" strokeWidth="1.35" opacity="0.95" />
                    <rect x="14" y="8" width="5" height="5" rx="0.7" fill="#dff3e3" stroke="#1f7a33" strokeWidth="1.15" />
                </svg>
            );
        case "galaxyGlobularCluster":
            return (
                <svg {...commonProps}>
                    <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(25 12 12)" fill="#dcecf9" stroke="#0f68b8" strokeWidth="1.35" opacity="0.95" />
                    <circle cx="16.1" cy="9.8" r="3" fill="#ffd6ea" stroke="#9f236a" strokeWidth="1.05" />
                    <path d="M16.1 7.1v5.4M13.4 9.8h5.4" stroke="#9f236a" strokeWidth="0.85" strokeLinecap="round" />
                </svg>
            );
        case "galaxyClusterNebula":
            return (
                <svg {...commonProps}>
                    <ellipse cx="12" cy="12" rx="7.5" ry="3" transform="rotate(25 12 12)" fill="#dcecf9" stroke="#0f68b8" strokeWidth="1.35" opacity="0.95" />
                    <circle cx="16.2" cy="9.5" r="2.6" fill="#fff08a" stroke="#5f4931" strokeWidth="1" strokeDasharray="1.3 1.6" />
                    <rect x="14.8" y="8.1" width="2.8" height="2.8" rx="0.4" fill="#dff3e3" stroke="#1f7a33" strokeWidth="0.8" />
                </svg>
            );
        case "globularCluster":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="6" fill="#ffd6ea" stroke="#9f236a" strokeWidth="1.1" />
                    <path d="M12 6.5v11M6.5 12h11" stroke="#9f236a" strokeWidth="1.05" strokeLinecap="round" />
                </svg>
            );
        case "nonexistent":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="6.8" fill="none" stroke="#4c5258" strokeWidth="1.65" opacity="0.95" />
                    <path d="M7.4 16.6l9.2-9.2" stroke="#4c5258" strokeWidth="1.85" strokeLinecap="round" opacity="0.95" />
                </svg>
            );
        case "openCluster":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="7.2" fill="#fff08a" stroke="#5f4931" strokeWidth="1.45" strokeDasharray="1.6 2.2" />
                </svg>
            );
        case "planetaryNebula":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="4.1" fill="#dcefd4" stroke="#257d2d" strokeWidth="1.65" />
                    <path d="M12 4.8v3.1M12 16.1v3.1M4.8 12h3.1M16.1 12h3.1" stroke="#257d2d" strokeWidth="1.55" strokeLinecap="round" />
                </svg>
            );
        case "supernovaRemnant":
            return (
                <svg {...commonProps}>
                    <path d="M6.2 13.8a6.5 6.5 0 0 0 11.2 1.8" fill="none" stroke="#56416f" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M17.8 10.2a6.5 6.5 0 0 0-11.2-1.8" fill="none" stroke="#56416f" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case "quasar":
            return (
                <svg {...commonProps}>
                    <path d="M12 3.8v6M12 14.2v6M3.8 12h6M14.2 12h6" stroke="#1f2933" strokeWidth="1.7" strokeLinecap="butt" />
                </svg>
            );
        case "galaxyCluster":
            return (
                <svg {...commonProps}>
                    <ellipse cx="8.1" cy="8.6" rx="3.5" ry="1.35" transform="rotate(22 8.1 8.6)" fill="#b9dcf6" stroke="#0f68b8" strokeWidth="1.2" />
                    <ellipse cx="16.2" cy="11" rx="3.2" ry="1.3" transform="rotate(-18 16.2 11)" fill="#b9dcf6" stroke="#0f68b8" strokeWidth="1.2" />
                    <ellipse cx="10.9" cy="16.3" rx="3.6" ry="1.35" transform="rotate(8 10.9 16.3)" fill="#b9dcf6" stroke="#0f68b8" strokeWidth="1.2" />
                </svg>
            );
        case "oneStar":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(12 12) scale(1.28)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                </svg>
            );
        case "twoStars":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(7.6 12) scale(0.86)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.2" />
                    <path d={STAR_PATH} transform="translate(16.4 12) scale(0.86) rotate(180)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.2" />
                </svg>
            );
        case "threeStars":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(7.4 13.5) scale(0.75)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                    <path d={STAR_PATH} transform="translate(12 7.6) scale(0.75)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                    <path d={STAR_PATH} transform="translate(16.6 14) scale(0.75)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                </svg>
            );
        case "fourStars":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(7.8 12) scale(1)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                    <text x="17.5" y="15.7" fill={STAR_STROKE} fontSize="10.4" fontWeight="700" textAnchor="middle">4</text>
                </svg>
            );
        case "eightStars":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(7.8 12) scale(1)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.1" />
                    <text x="17.5" y="15.7" fill={STAR_STROKE} fontSize="10.4" fontWeight="700" textAnchor="middle">8</text>
                </svg>
            );
        case "planet":
            return (
                <svg {...commonProps}>
                    <g transform="rotate(-12 12 12)">
                        <ellipse cx="12" cy="12.2" rx="9.4" ry="3.25" fill="none" stroke="#111111" strokeWidth="1.35" />
                    </g>
                    <circle cx="12" cy="11.7" r="5.4" fill="#111111" />
                    <path d="M7.6 14.35c2.8-.12 5.9-.68 8.8-1.65" fill="none" stroke="#ffffff" strokeWidth="0.95" strokeLinecap="round" />
                    <path d="M6.2 15.4c3.7.8 8.8-.1 12.5-2.4" fill="none" stroke="#111111" strokeWidth="1.35" strokeLinecap="round" />
                    <path d="M8 16.1c2.2 1.7 5.9 1.7 8.1-.4a5.4 5.4 0 0 1-8.1.4z" fill="#111111" />
                </svg>
            );
        case "moon":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="6.8" fill="#a0a0a0" stroke="#202932" strokeWidth="1.55" />
                    <circle cx="15.2" cy="10.4" r="6.8" fill="#ffffff" opacity="0.92" />
                </svg>
            );
        case "asteroid":
            return (
                <svg {...commonProps}>
                    <path d="M7.6 8.2l5.1-2.4 4.5 2.8 1.2 5.2-3.7 4.2-5.8-.8-2.7-4.5z" fill="#d8d6d2" stroke="#57534d" strokeWidth="1" strokeLinejoin="round" />
                </svg>
            );
        case "comet":
            return (
                <svg {...commonProps}>
                    <path d="M5.5 8.2c4.4.2 7.3 1.5 10.8 5.3" fill="none" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M5.1 12.1c3.8-.1 7 1.2 10.3 3.9" fill="none" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="17" cy="16" r="2.2" fill="#d7f0ef" stroke="#000000" strokeWidth="1.4" />
                </svg>
            );
        case "meteorShower":
            return (
                <svg {...commonProps}>
                    <path d="M12 9.1l-.8-5.2c-.1-.8.5-1.5 1.3-1.5s1.4.7 1.2 1.5L12.6 9.1z" fill="#1f2933" />
                    <path d="M9.4 10.2L5.2 6.6c-.6-.5-.6-1.4 0-1.9.6-.6 1.5-.5 1.9.1l3.1 4.7z" fill="#1f2933" />
                    <path d="M14.4 10.2l3.9-4c.5-.6 1.5-.6 2 .1.5.6.4 1.5-.2 1.9l-4.8 2.8z" fill="#1f2933" />
                    <path d="M8.8 12.7l-5.2-.9c-.8-.1-1.3-.9-1-1.7.2-.8 1.1-1.1 1.8-.7l4.8 2.5z" fill="#1f2933" />
                    <path d="M15.2 12.6l5.1-.2c.8 0 1.4.6 1.3 1.4-.1.8-.9 1.3-1.6 1l-4.9-1.5z" fill="#1f2933" />
                    <path d="M9.7 14.9l-3 4.3c-.5.7-1.4.8-2 .2-.6-.5-.6-1.5.1-2l4.2-3.3z" fill="#1f2933" />
                    <path d="M14.2 14.9l3.6 4.1c.5.6.4 1.5-.3 2-.7.4-1.5.2-1.9-.5l-2.2-5z" fill="#1f2933" />
                    <circle cx="12" cy="12" r="2.1" fill="#ffffff" />
                </svg>
            );
        case "sun":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="4.7" fill="#ffd861" stroke="#a86a09" strokeWidth="1.35" />
                    <path d="M12 3.8v2.2M12 18v2.2M3.8 12h2.2M18 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6" stroke="#a86a09" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
            );
        case "doubleStar":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(7.6 12) scale(0.86)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.2" />
                    <path d={STAR_PATH} transform="translate(16.4 12) scale(0.86) rotate(180)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1.2" />
                </svg>
            );
        case "variableStar":
            return (
                <svg {...commonProps}>
                    <path d={STAR_PATH} transform="translate(12 9.8) scale(1) rotate(0)" fill={STAR_FILL} stroke={STAR_STROKE} strokeWidth="1" />
                    <path d="M6.9 17.5c1.7-2.4 3.4-2.4 5.1 0s3.4 2.4 5.1 0" fill="none" stroke={STAR_STROKE} strokeWidth="1.25"  strokeLinecap="round" />
                </svg>
            );
        case "supernova":
            return (
                <svg {...commonProps}>
                    <g transform="translate(12 12) scale(0.86) translate(-12 -12)">
                        <path d="M12 2.2l1.45 7.05L21.8 12l-8.35 2.75L12 21.8l-1.45-7.05L2.2 12l8.35-2.75z" fill="#1f4f8f" stroke="#0d274c" strokeWidth="0.5" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3.2" fill="#1f4f8f" stroke="#0d274c" strokeWidth="1" />
                        <circle cx="12" cy="12" r="1.6" fill="#ffffff" />
                    </g>
                </svg>
            );
        default:
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="8.5" fill="#a2a2a2" />
                    <path d="M12 4.8 L13.45 10.55 L19.2 12 L13.45 13.45 L12 19.2 L10.55 13.45 L4.8 12 L10.55 10.55 Z" fill="#ffffff" />
                </svg>
            );
    }
}

// Renders candidate glyphs for previewing alternative undefined-object icons without changing the active fallback yet.
export function UndefinedObjectIcon({ candidate, className, size = 22 }: { candidate: UndefinedObjectIconCandidate; className?: string; size?: number }) {
    const commonProps = {
        "aria-hidden": true,
        className,
        "data-dso-type-icon": `undefined-${candidate}`,
        focusable: "false",
        height: size,
        style: ICON_INLINE_STYLE,
        viewBox: `0 ${ICON_VIEWBOX_Y_OFFSET} 24 24`,
        width: size,
    } as const;

    switch (candidate) {
        case "sparkleGroup":
            return (
                <svg {...commonProps}>
                    <path d={SPARKLE_PATH} transform="translate(14.5 11.5) scale(0.88)" fill="#1f2933" />
                    <path d={SPARKLE_PATH} transform="translate(8.5 8.5) scale(0.46)" fill="#1f2933" />
                    <path d={SPARKLE_PATH} transform="translate(10 15.5) scale(0.52)" fill="#1f2933" />
                    <circle cx="12" cy="12" r="8.5" fill="none" stroke="#343a40" strokeWidth="1.45" />
                </svg>
            );
        case "starDisc":
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="8.5" fill="#a2a2a2" />
                    <path d="M12 4.8 L13.45 10.55 L19.2 12 L13.45 13.45 L12 19.2 L10.55 13.45 L4.8 12 L10.55 10.55 Z" fill="#ffffff" />
                </svg>
            );
        case "markedStar":
            return (
                <svg {...commonProps}>
                    <rect x="4" y="4" width="16" height="16" rx="0.9" fill="#ffffff" stroke="#555555" strokeWidth="1.45" strokeDasharray="3 2.3" />
                    <path d={SPARKLE_PATH} transform="translate(14.5 11.5) scale(0.88)" fill="#1f2933" />
                    <path d={SPARKLE_PATH} transform="translate(8.5 8.5) scale(0.46)" fill="#1f2933" />
                    <path d={SPARKLE_PATH} transform="translate(10 15.5) scale(0.52)" fill="#1f2933" />
                </svg>
            );
    }
}
