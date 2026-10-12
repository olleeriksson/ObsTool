import atlas from "../data/interstellarum-chart-footprints.json";
import { CelestialPosition, parseMapObjectPosition } from "./ConstellationMapUtils";
import { IConstellationMapObject } from "../types/Types";

export interface InterstellarumChart {
    chart: number;
    projection_center_ra_hours: number | null;
    projection_center_dec_deg: number;
    bounding_box: { dec_min_deg: number; dec_max_deg: number };
    pages: { boundary_ra_dec_deg: number[][]; projection_plane_corners_degree_equivalent: number[][] }[];
}
export const interstellarumCharts: InterstellarumChart[] = atlas.charts;

// Project into the calibrated stereographic plane, including RA wrap and both celestial poles.
export function chartContainsPosition(chart: InterstellarumChart, position: CelestialPosition) {
    if (!Number.isFinite(position.longitude) || !Number.isFinite(position.latitude) || Math.abs(position.latitude) > 90) { return false; }
    const radians = Math.PI / 180;
    const delta = (position.longitude - (chart.projection_center_ra_hours ?? 0) * 15) * radians;
    const dec = position.latitude * radians;
    const center = chart.projection_center_dec_deg * radians;
    const denominator = 1 + Math.sin(center) * Math.sin(dec) + Math.cos(center) * Math.cos(dec) * Math.cos(delta);
    if (denominator < 1e-12) { return false; }
    const x = -2 * Math.cos(dec) * Math.sin(delta) / denominator / radians;
    const y = 2 * (Math.cos(center) * Math.sin(dec) - Math.sin(center) * Math.cos(dec) * Math.cos(delta)) / denominator / radians;
    return chart.pages.some(page => {
        let positive = false;
        let negative = false;
        const corners = page.projection_plane_corners_degree_equivalent;
        for (let i = 0; i < corners.length; i++) {
            const a = corners[i];
            const b = corners[(i + 1) % corners.length];
            const cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
            positive ||= cross > 1e-5;
            negative ||= cross < -1e-5;
            if (positive && negative) { return false; }
        }
        return true;
    });
}

// Preserve all memberships because neighboring atlas spreads intentionally overlap.
export function getObjectCharts(object: IConstellationMapObject) {
    const position = parseMapObjectPosition(object);
    return position ? interstellarumCharts.filter(chart => chartContainsPosition(chart, position)).map(chart => chart.chart) : [];
}
