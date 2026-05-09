import { IConstellationMapObject } from "../types/Types";

export type ConstellationMapLabelMode = "sac" | "herschel";

export interface CelestialPosition {
    longitude: number;
    latitude: number;
}

export interface MapExtent {
    centerLongitude: number;
    centerLatitude: number;
    minPlaneX: number;
    maxPlaneX: number;
    minPlaneY: number;
    maxPlaneY: number;
}

export interface ProjectedPoint extends CelestialPosition {
    planeX: number;
    planeY: number;
    x: number;
    y: number;
}

export interface ProjectedLabelCandidate extends ProjectedPoint {
    key: string;
    label: string;
    markerRadius: number;
}

export interface LabelPlacement {
    key: string;
    label: string;
    textX: number;
    textY: number;
    box: LabelBox;
    candidate: ProjectedLabelCandidate;
}

interface LabelBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function normalizeConstellationId(constellation: string | undefined | null) {
    return (constellation || "").trim().toUpperCase();
}

export function parseRaToLongitude(ra: string | undefined | null) {
    const parts = parseCoordinateParts(ra);
    if (parts.length === 0) {
        return null;
    }

    const hours = parts[0];
    const minutes = parts.length > 1 ? parts[1] : 0;
    const seconds = parts.length > 2 ? parts[2] : 0;
    const degrees = (hours + minutes / 60 + seconds / 3600) * 15;
    return normalizeLongitude(degrees);
}

export function parseDecToDegrees(dec: string | undefined | null) {
    const parts = parseCoordinateParts(dec);
    if (parts.length === 0) {
        return null;
    }

    const trimmed = (dec || "").trim();
    const sign = trimmed.startsWith("-") || parts[0] < 0 ? -1 : 1;
    const degrees = Math.abs(parts[0]) + (parts.length > 1 ? parts[1] / 60 : 0) + (parts.length > 2 ? parts[2] / 3600 : 0);
    return sign * degrees;
}

export function parseMapObjectPosition(object: IConstellationMapObject): CelestialPosition | null {
    const longitude = parseRaToLongitude(object.ra);
    const latitude = parseDecToDegrees(object.dec);
    if (longitude == null || latitude == null) {
        return null;
    }

    return { longitude, latitude };
}

export function getMapObjectKey(object: IConstellationMapObject) {
    if (object.herschelId != null) {
        return `h-${object.herschelId}`;
    }

    if (object.dsoId != null) {
        return `d-${object.dsoId}`;
    }

    if (object.id != null) {
        return String(object.id);
    }

    return `${object.name}-${object.ra}-${object.dec}`;
}

export function formatMapObjectLabel(object: IConstellationMapObject, labelMode: ConstellationMapLabelMode) {
    if (labelMode === "herschel" && object.herschelNo) {
        return object.herschelNo;
    }

    if (object.catalog && object.catalogNumber) {
        return object.catalog.toUpperCase() === "M"
            ? `${object.catalog}${object.catalogNumber}`
            : `${object.catalog} ${object.catalogNumber}`;
    }

    return object.name;
}

export function normalizeLongitude(longitude: number) {
    let normalized = longitude % 360;
    if (normalized > 180) {
        normalized -= 360;
    }
    if (normalized <= -180) {
        normalized += 360;
    }
    return normalized;
}

export function unwrapLongitudeRelative(longitude: number, centerLongitude: number) {
    let unwrapped = longitude;
    while (unwrapped - centerLongitude > 180) {
        unwrapped -= 360;
    }
    while (unwrapped - centerLongitude < -180) {
        unwrapped += 360;
    }
    return unwrapped;
}

export function createMapExtent(coordinates: CelestialPosition[]): MapExtent | null {
    if (coordinates.length === 0) {
        return null;
    }

    const center = getSphericalMeanCenter(coordinates);
    const planePoints = coordinates
        .map(point => projectToTangentPlane(point, center.longitude, center.latitude))
        .filter((point): point is { planeX: number; planeY: number } => point != null);

    if (planePoints.length === 0) {
        return null;
    }

    let minPlaneX = Math.min(...planePoints.map(point => point.planeX));
    let maxPlaneX = Math.max(...planePoints.map(point => point.planeX));
    let minPlaneY = Math.min(...planePoints.map(point => point.planeY));
    let maxPlaneY = Math.max(...planePoints.map(point => point.planeY));

    if (maxPlaneX - minPlaneX < 0.001) {
        minPlaneX -= 0.0005;
        maxPlaneX += 0.0005;
    }

    if (maxPlaneY - minPlaneY < 0.001) {
        minPlaneY -= 0.0005;
        maxPlaneY += 0.0005;
    }

    return {
        centerLongitude: center.longitude,
        centerLatitude: center.latitude,
        minPlaneX,
        maxPlaneX,
        minPlaneY,
        maxPlaneY,
    };
}

export function projectPosition(position: CelestialPosition, extent: MapExtent, width: number, height: number, paddingX: number, paddingY: number): ProjectedPoint | null {
    const planePoint = projectToTangentPlane(position, extent.centerLongitude, extent.centerLatitude);
    if (planePoint == null) {
        return null;
    }

    const planeSpanX = Math.max(0.001, extent.maxPlaneX - extent.minPlaneX);
    const planeSpanY = Math.max(0.001, extent.maxPlaneY - extent.minPlaneY);
    const drawableWidth = Math.max(1, width - paddingX * 2);
    const drawableHeight = Math.max(1, height - paddingY * 2);
    const scale = Math.min(drawableWidth / planeSpanX, drawableHeight / planeSpanY);
    const usedWidth = planeSpanX * scale;
    const usedHeight = planeSpanY * scale;
    const xOffset = (width - usedWidth) / 2;
    const yOffset = (height - usedHeight) / 2;

    return {
        longitude: unwrapLongitudeRelative(position.longitude, extent.centerLongitude),
        latitude: position.latitude,
        planeX: planePoint.planeX,
        planeY: planePoint.planeY,
        x: xOffset + (planePoint.planeX - extent.minPlaneX) * scale,
        y: yOffset + (extent.maxPlaneY - planePoint.planeY) * scale,
    };
}

export function projectToTangentPlane(position: CelestialPosition, centerLongitude: number, centerLatitude: number) {
    const longitudeDelta = degreesToRadians(unwrapLongitudeRelative(position.longitude, centerLongitude) - centerLongitude);
    const latitude = degreesToRadians(position.latitude);
    const centerLatitudeRadians = degreesToRadians(centerLatitude);
    const sinLatitude = Math.sin(latitude);
    const cosLatitude = Math.cos(latitude);
    const sinCenterLatitude = Math.sin(centerLatitudeRadians);
    const cosCenterLatitude = Math.cos(centerLatitudeRadians);
    const cosLongitudeDelta = Math.cos(longitudeDelta);
    const denominator = sinCenterLatitude * sinLatitude + cosCenterLatitude * cosLatitude * cosLongitudeDelta;

    if (denominator <= 0.000001) {
        return null;
    }

    return {
        // Sky charts conventionally place increasing RA to the left.
        planeX: -cosLatitude * Math.sin(longitudeDelta) / denominator,
        planeY: (cosCenterLatitude * sinLatitude - sinCenterLatitude * cosLatitude * cosLongitudeDelta) / denominator,
    };
}

export function orderBySpread<T extends CelestialPosition>(candidates: T[], anchors: CelestialPosition[] = []) {
    const remaining = [...candidates];
    const ordered: T[] = [];
    const anchorPoints = [...anchors];

    while (remaining.length > 0) {
        let bestIndex = 0;
        let bestScore = -Infinity;
        const centroid = anchorPoints.length === 0 ? getCentroid(remaining) : null;

        for (let index = 0; index < remaining.length; index++) {
            const candidate = remaining[index];
            const score = anchorPoints.length === 0 && centroid != null
                ? celestialDistanceSquared(candidate, centroid)
                : Math.min(...anchorPoints.map(anchor => celestialDistanceSquared(candidate, anchor)));

            if (score > bestScore) {
                bestIndex = index;
                bestScore = score;
            }
        }

        const [next] = remaining.splice(bestIndex, 1);
        ordered.push(next);
        anchorPoints.push(next);
    }

    return ordered;
}

export function selectLabelPlacements(
    highlightedCandidates: ProjectedLabelCandidate[],
    normalCandidates: ProjectedLabelCandidate[],
    maxNumLabels: number,
    fontSize: number,
    viewBoxWidth: number,
    viewBoxHeight: number,
    allowCollisions = false) {
    const maxLabels = Math.max(0, Math.floor(maxNumLabels));
    if (maxLabels === 0) {
        return [];
    }

    const visibleHighlightedCandidates = highlightedCandidates.filter(candidate => isCandidateVisible(candidate, viewBoxWidth, viewBoxHeight));
    const visibleNormalCandidates = normalCandidates.filter(candidate => isCandidateVisible(candidate, viewBoxWidth, viewBoxHeight));

    // Highlighted objects consume the label budget first; each priority group is ordered
    // by sky separation so crowded maps avoid clustering labels in one region.
    const highlightedOrder = orderBySpread(visibleHighlightedCandidates);
    const normalOrder = orderBySpread(visibleNormalCandidates, highlightedOrder);
    const orderedCandidates = [...highlightedOrder, ...normalOrder];
    const candidatesWithBoxes = orderedCandidates
        .map((candidate, index) => ({ candidate, index, box: estimateLabelBox(candidate, fontSize, viewBoxWidth, viewBoxHeight) }))
        .filter((candidate): candidate is { candidate: ProjectedLabelCandidate; index: number; box: LabelBox } => candidate.box != null);
    const placements: LabelPlacement[] = [];
    const placedKeys = new Set<string>();

    for (const candidate of candidatesWithBoxes) {
        if (placements.length >= maxLabels) {
            break;
        }

        if (allowCollisions || !placements.some(placement => boxesOverlap(placement.box, candidate.box))) {
            placements.push(createLabelPlacement(candidate.candidate, candidate.box, fontSize));
            placedKeys.add(candidate.candidate.key);
        }
    }

    // Once all clean placements are used, keep honoring the requested count by
    // adding the candidates that overlap the least. This avoids dead slider
    // ranges and the all-at-once jump at maximum label count.
    const relaxedCandidates = candidatesWithBoxes.filter(candidate => !placedKeys.has(candidate.candidate.key));
    while (!allowCollisions && placements.length < maxLabels && relaxedCandidates.length > 0) {
        let bestIndex = 0;
        let bestScore = Infinity;

        for (let index = 0; index < relaxedCandidates.length; index++) {
            const score = getOverlapScore(relaxedCandidates[index].box, placements);
            if (score < bestScore || (score === bestScore && relaxedCandidates[index].index < relaxedCandidates[bestIndex].index)) {
                bestIndex = index;
                bestScore = score;
            }
        }

        const [candidate] = relaxedCandidates.splice(bestIndex, 1);
        placements.push(createLabelPlacement(candidate.candidate, candidate.box, fontSize));
    }

    return placements;
}

function isCandidateVisible(candidate: ProjectedLabelCandidate, viewBoxWidth: number, viewBoxHeight: number) {
    return candidate.x >= 0 &&
        candidate.x <= viewBoxWidth &&
        candidate.y >= 0 &&
        candidate.y <= viewBoxHeight;
}

function parseCoordinateParts(value: string | undefined | null) {
    if (!value) {
        return [];
    }

    const parts = value
        .trim()
        .replace(/[hHdDmMsS'"]/g, " ")
        .split(/[\s:]+/)
        .filter(Boolean)
        .map(part => Number(part));

    return parts.some(part => Number.isNaN(part)) ? [] : parts;
}

function getCircularMeanLongitude(longitudes: number[]) {
    const radians = longitudes.map(longitude => longitude * Math.PI / 180);
    const sin = radians.reduce((sum, value) => sum + Math.sin(value), 0);
    const cos = radians.reduce((sum, value) => sum + Math.cos(value), 0);
    return normalizeLongitude(Math.atan2(sin, cos) * 180 / Math.PI);
}

function getSphericalMeanCenter(points: CelestialPosition[]): CelestialPosition {
    const vector = points.reduce((sum, point) => {
        const longitude = degreesToRadians(point.longitude);
        const latitude = degreesToRadians(point.latitude);
        const cosLatitude = Math.cos(latitude);
        return {
            x: sum.x + cosLatitude * Math.cos(longitude),
            y: sum.y + cosLatitude * Math.sin(longitude),
            z: sum.z + Math.sin(latitude),
        };
    }, { x: 0, y: 0, z: 0 });

    const horizontalLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (horizontalLength === 0) {
        return {
            longitude: getCircularMeanLongitude(points.map(point => point.longitude)),
            latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
        };
    }

    return {
        longitude: normalizeLongitude(radiansToDegrees(Math.atan2(vector.y, vector.x))),
        latitude: radiansToDegrees(Math.atan2(vector.z, horizontalLength)),
    };
}

function getCentroid(points: CelestialPosition[]): CelestialPosition {
    return {
        longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
        latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
    };
}

function celestialDistanceSquared(a: CelestialPosition, b: CelestialPosition) {
    const longitudeDelta = Math.abs(a.longitude - b.longitude);
    const wrappedLongitudeDelta = longitudeDelta > 180 ? 360 - longitudeDelta : longitudeDelta;
    const averageLatitudeRadians = (a.latitude + b.latitude) / 2 * Math.PI / 180;
    const x = wrappedLongitudeDelta * Math.cos(averageLatitudeRadians);
    const y = a.latitude - b.latitude;
    return x * x + y * y;
}

function estimateLabelBox(candidate: ProjectedLabelCandidate, fontSize: number, viewBoxWidth: number, viewBoxHeight: number): LabelBox | null {
    const width = Math.max(fontSize * 1.5, candidate.label.length * fontSize * 0.58 + 8);
    const height = fontSize + 5;
    const gap = candidate.markerRadius + 2;
    const x = candidate.x - width / 2;
    let y = candidate.y + gap;

    if (x < 2 || x + width > viewBoxWidth - 2) {
        return null;
    }

    if (y + height > viewBoxHeight - 2) {
        y = candidate.y - gap - height;
    }

    if (y < 2 || y + height > viewBoxHeight - 2) {
        return null;
    }

    return { x, y, width, height };
}

function boxesOverlap(a: LabelBox, b: LabelBox) {
    const padding = 2;
    return a.x - padding < b.x + b.width &&
        a.x + a.width + padding > b.x &&
        a.y - padding < b.y + b.height &&
        a.y + a.height + padding > b.y;
}

function createLabelPlacement(candidate: ProjectedLabelCandidate, box: LabelBox, fontSize: number): LabelPlacement {
    return {
        key: candidate.key,
        label: candidate.label,
        textX: box.x + box.width / 2,
        textY: box.y + fontSize,
        box,
        candidate,
    };
}

function getOverlapScore(box: LabelBox, placements: LabelPlacement[]) {
    return placements.reduce((score, placement) => score + getOverlapArea(box, placement.box), 0);
}

function getOverlapArea(a: LabelBox, b: LabelBox) {
    const padding = 2;
    const left = Math.max(a.x - padding, b.x - padding);
    const right = Math.min(a.x + a.width + padding, b.x + b.width + padding);
    const top = Math.max(a.y - padding, b.y - padding);
    const bottom = Math.min(a.y + a.height + padding, b.y + b.height + padding);

    return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function degreesToRadians(value: number) {
    return value * Math.PI / 180;
}

function radiansToDegrees(value: number) {
    return value * 180 / Math.PI;
}
