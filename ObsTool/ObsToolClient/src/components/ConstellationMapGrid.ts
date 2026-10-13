import { CelestialPosition, normalizeLongitude } from "./ConstellationMapUtils";

export interface MapGridSpacing {
    raMinutes: number;
    decDegrees: number;
}

export interface MapGridDimensions {
    width: number;
    height: number;
}

// Use the geometric mean of plot dimensions so narrow and shallow maps both get fewer grid lines.
export function getConstellationGridScale({ width, height }: MapGridDimensions): number {
    const effectiveSize = Math.sqrt(Math.max(0, width) * Math.max(0, height));
    // These steps preserve the RA/DEC ratio and divide the full RA circle evenly at every declination.
    return effectiveSize >= 700 ? 2 : effectiveSize >= 450 ? 4 : effectiveSize >= 250 ? 8 : 12;
}

// Match the requested atlas bands exactly; other maps use the nearest atlas center declination.
export function getMapGridSpacing(centerDeclination: number, chartNumber?: number, dimensions?: MapGridDimensions): MapGridSpacing {
    let raMinutes: MapGridSpacing["raMinutes"];
    if (chartNumber != null) {
        if (chartNumber === 1 || chartNumber === 114) {
            raMinutes = 30;
        } else if ((chartNumber >= 2 && chartNumber <= 7) || (chartNumber >= 108 && chartNumber <= 113)) {
            raMinutes = 20;
        } else if ((chartNumber >= 8 && chartNumber <= 15) || (chartNumber >= 100 && chartNumber <= 107)) {
            raMinutes = 10;
        } else {
            raMinutes = 5;
        }
    } else {
        // Atlas centers are at |DEC| 45, 60, 75 and 90 degrees; split their overlapping bands halfway.
        const absoluteDeclination = Math.abs(centerDeclination);
        raMinutes = absoluteDeclination >= 82.5 ? 30
            : absoluteDeclination >= 67.5 ? 20
            : absoluteDeclination >= 52.5 ? 10 : 5;
    }
    // Atlas spacing remains exact at every size; constellation maps start with twice its intervals.
    const scale = chartNumber != null ? 1 : dimensions ? getConstellationGridScale(dimensions) : 2;
    return { raMinutes: raMinutes * scale, decDegrees: scale };
}

// Build aligned RA meridians and DEC parallels, with sample resolution independent of line spacing.
export function createGridSegments(focusedBoundaryPositions: CelestialPosition[], spacing: MapGridSpacing): [number, number][][] {
    const latitudes = focusedBoundaryPositions.map(point => point.latitude);
    const minLatitude = Math.max(-89, Math.min(...latitudes) - 20);
    const maxLatitude = Math.min(89, Math.max(...latitudes) + 20);
    // Align parallels to DEC zero while keeping coarse steps inside the celestial poles.
    const latitudeStart = Math.ceil(minLatitude / spacing.decDegrees) * spacing.decDegrees;
    const latitudeEnd = Math.floor(maxLatitude / spacing.decDegrees) * spacing.decDegrees;
    const segments: [number, number][][] = [];

    // One minute of RA is a quarter degree; integer minutes avoid accumulating angular rounding errors.
    for (let raMinutes = -720; raMinutes < 720; raMinutes += spacing.raMinutes) {
        const longitude = raMinutes / 4;
        const segment: [number, number][] = [];
        for (let latitude = -89; latitude <= 89; latitude += 2) {
            segment.push([normalizeLongitude(longitude), latitude]);
        }
        segments.push(segment);
    }

    for (let latitude = latitudeStart; latitude <= latitudeEnd; latitude += spacing.decDegrees) {
        const segment: [number, number][] = [];
        for (let longitude = -180; longitude <= 180; longitude += 2) {
            segment.push([normalizeLongitude(longitude), latitude]);
        }
        segments.push(segment);
    }

    return segments;
}
