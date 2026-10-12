import * as React from "react";
import TableCell from "@mui/material/TableCell";
import Tooltip from "@mui/material/Tooltip";
import SvgIcon from "@mui/material/SvgIcon";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CloseIcon from "@mui/icons-material/Close";
import Api from "../api/Api";
import bounds from "../data/constellations/constellations.bounds.json";
import { getMapObjectKey } from "./ConstellationMapUtils";
import { useLabelVisibility } from "../store/LabelVisibilityStore";

// Keep the blank header and every status cell at the icon's minimum content width.
const statusCellStyle: React.CSSProperties = { width: 1, padding: "0 4px", whiteSpace: "nowrap" };

// Use a warmer green for fully visible constellations and a shared light gray for partly visible ones.
const statusColors = { full: "#4f8532", partial: "#a1a1a1", never: "#000000", unstarted: "#a1a1a1", empty: "#d32f2f" };

// Draw three horizontal dots at the same size as the checkbox icons.
function EllipsisIcon() {
    return (
        <SvgIcon fontSize="small" data-testid="EllipsisIcon">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
        </SvgIcon>
    );
}

// At upper culmination, declinations at or south of latitude minus 90 degrees never rise above the horizon.
export function classifyDeclinationBounds(min: number, max: number, latitude = 55.3): "full" | "partial" | "never" {
    const limit = latitude - 90;
    return max <= limit ? "never" : min > limit ? "full" : "partial";
}

// Use the existing celestial boundary data, including all rings, to classify the declination bounding box.
export function getConstellationVisibility(constellation: string) {
    const points = bounds.features.filter(feature => feature.id.toUpperCase() === constellation.toUpperCase())
        .flatMap(feature => feature.geometry.coordinates.flat());
    if (points.length === 0) { return undefined; }
    const declinations = points.map(point => point[1]);
    return classifyDeclinationBounds(Math.min(...declinations), Math.max(...declinations));
}

// Render the global-filter column header only while filtering is enabled.
export function ConstellationLabelStatusHeader() {
    const { enabled } = useLabelVisibility();
    return enabled ? <TableCell style={statusCellStyle} component="th" scope="col" aria-label="Label visibility status" /> : null;
}

// Load catalog identities only for constellations with saved hidden labels; never infer completion from a visible map subset.
export default function ConstellationLabelStatus({ constellation, total }: { constellation: string; total: number }) {
    const { enabled, hiddenByConstellation } = useLabelVisibility();
    const hidden = hiddenByConstellation[constellation.toUpperCase()] || [];
    const [catalog, setCatalog] = React.useState<{ constellation: string; keys: string[] }>();
    const [failed, setFailed] = React.useState(false);
    const needsCatalog = enabled && hidden.length > 0 && total > 0;
    React.useEffect(() => {
        if (!needsCatalog) { return; }
        let active = true;
        setFailed(false);
        Api.getH2500ObjectsForConstellationMap(constellation).then(response => {
            if (active) { setCatalog({ constellation, keys: response.data.map(getMapObjectKey) }); }
        }, () => { if (active) { setFailed(true); } });
        return () => { active = false; };
    }, [constellation, needsCatalog]);
    if (!enabled) { return null; }
    const visibility = getConstellationVisibility(constellation);
    const loading = needsCatalog && catalog?.constellation !== constellation;
    if (!visibility || loading || failed) {
        return <TableCell style={statusCellStyle} aria-label={failed ? "Could not load label status" : "Loading label status"} />;
    }
    // Count only current catalog identities; stale saved keys cannot create a half-done status.
    const catalogKeys = catalog?.constellation === constellation ? [...new Set(catalog.keys)] : [];
    const hiddenKeys = new Set(hidden);
    const hiddenCount = catalogKeys.filter(key => hiddenKeys.has(key)).length;
    const complete = total > 0 && catalogKeys.length > 0 && hiddenCount === catalogKeys.length;
    const partlyHidden = hiddenCount > 0 && !complete;
    const color = total === 0 ? statusColors.empty
        : visibility === "never" && !complete && !partlyHidden ? statusColors.unstarted : statusColors[visibility];
    const description = `${constellation}: ${visibility === "full" ? "Fully" : visibility === "partial" ? "Partly" : "Never"} visible at 55.3\u00b0 N; ${total === 0 ? "No Herschel objects" : complete ? "All done" : partlyHidden ? "Half done" : "Not started"}`;
    return (
        <TableCell style={statusCellStyle} align="center">
            {(total === 0 || complete || partlyHidden || visibility !== "full") && (
                <Tooltip title={description}>
                    <span role="img" aria-label={description} style={{ display: "inline-flex", color }}>
                        {complete ? <CheckBoxIcon fontSize="small" />
                            : partlyHidden ? <CheckBoxOutlineBlankIcon fontSize="small" />
                            : total > 0 && visibility === "partial" ? <EllipsisIcon /> : <CloseIcon fontSize="small" />}
                    </span>
                </Tooltip>
            )}
        </TableCell>
    );
}
