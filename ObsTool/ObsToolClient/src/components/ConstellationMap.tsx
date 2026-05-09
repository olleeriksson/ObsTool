import * as React from "react";
import Slider from "@mui/material/Slider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { createStyles, withStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import { IConstellationMapObject } from "../types/Types";
import constellationBoundsJson from "../data/constellations/constellations.bounds.json";
import constellationLinesJson from "../data/constellations/constellations.lines.json";
import {
    CelestialPosition,
    ConstellationMapLabelMode,
    createMapExtent,
    formatMapObjectLabel,
    getMapObjectKey,
    normalizeConstellationId,
    normalizeLongitude,
    parseMapObjectPosition,
    projectPosition,
    ProjectedLabelCandidate,
    ProjectedPoint,
    selectLabelPlacements,
} from "./ConstellationMapUtils";

interface GeoJsonFeatureCollection {
    features: GeoJsonFeature[];
}

interface GeoJsonFeature {
    id?: string;
    geometry: {
        type: string;
        coordinates: unknown;
    };
}

type RawCoordinate = [number, number];

export interface IConstellationMapProps {
    constellation: string;
    constellationName?: string;
    objects: IConstellationMapObject[];
    backgroundObjects?: IConstellationMapObject[];
    highlightedObjects?: IConstellationMapObject[];
    maxNumLabels?: number;
    labelMode?: ConstellationMapLabelMode;
    width?: number | string;
    height?: number;
    showControls?: boolean;
    initialZoom?: number;
    allowZoom?: boolean;
}

interface ProjectedMapObject extends ProjectedLabelCandidate {
    object: IConstellationMapObject;
}

type MapExtent = NonNullable<ReturnType<typeof createMapExtent>>;
interface PlanePan {
    x: number;
    y: number;
}

interface DragState {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPan: PlanePan;
}

interface MapPadding {
    x: number;
    y: number;
}

const viewBoxWidth = 1000;
const defaultHeight = 420;
const boundaryPaddingRatio = 0.02;
const labelFontSize = 12;
const minZoom = 1.0;
const maxZoom = 6;

const styles = (theme: Theme) => createStyles({
    root: {
        background: "#f2f2f2",
        border: "1px solid #bdbdbd",
        borderRadius: 6,
        display: "flex",
        overflow: "hidden",
    },
    unavailable: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
    },
    plotContainer: {
        flex: "1 1 auto",
        minWidth: 0,
    },
    plotSvg: {
        background: "#f4f4f4",
        display: "block",
        maxWidth: "100%",
        touchAction: "none",
        userSelect: "none",
    },
    plotSvgIdle: {
        cursor: "default",
    },
    plotSvgDragging: {
        cursor: "move",
    },
    surroundingBoundary: {
        fill: "none",
        stroke: "#d1d1d1",
        strokeDasharray: "5 4",
        strokeWidth: 0.9,
    },
    gridLine: {
        fill: "none",
        stroke: "#cfcfcf",
        strokeWidth: 0.8,
    },
    surroundingLine: {
        fill: "none",
        stroke: "#c2c2c2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.1,
    },
    focusedBoundary: {
        fill: "none",
        stroke: "#626262",
        strokeDasharray: "6 4",
        strokeWidth: 1.5,
    },
    focusedLine: {
        fill: "none",
        stroke: "#777777",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.6,
    },
    surroundingVertex: {
        fill: "#b2b2b2",
    },
    focusedVertex: {
        fill: "#666666",
    },
    objectLabel: {
        cursor: "pointer",
        fill: "#0184bc",
        fontFamily: "'Trebuchet MS', Verdana, sans-serif",
        fontSize: labelFontSize,
        paintOrder: "stroke",
        stroke: "#ffffff",
        strokeWidth: 2.2,
    },
    controlsPanel: {
        background: "#ececec",
        borderLeft: "1px solid #c8c8c8",
        color: "#333",
        flex: "0 0 194px",
        padding: "18px 16px",
    },
    controlsTitle: {
        color: "#222",
        letterSpacing: 1.2,
    },
    labelsCaption: {
        color: "#4d4d4d",
        marginBottom: theme.spacing(0.75),
        marginTop: theme.spacing(1.5),
    },
    labelToggleGroup: {
        marginBottom: theme.spacing(2),
    },
    labelToggleButton: {
        fontSize: 11,
        lineHeight: 1.15,
        minHeight: 24,
        padding: "2px 6px",
    },
    labelCount: {
        color: "#4d4d4d",
    },
    controlHelpText: {
        color: "#666",
        lineHeight: 1.35,
        marginTop: theme.spacing(2.25),
    },
    zoomText: {
        color: "#666",
        marginTop: theme.spacing(1),
    },
    selectedObjectInfo: {
        background: "#f8f8f8",
        border: "1px solid #b8b8b8",
        borderRadius: 4,
        color: "#222",
        fontSize: 12,
        lineHeight: 1.35,
        marginTop: 14,
        padding: "8px 10px",
    },
});

type ConstellationMapClasses = WithStyles<typeof styles>["classes"];

const constellationBounds = constellationBoundsJson as GeoJsonFeatureCollection;
const constellationLines = constellationLinesJson as GeoJsonFeatureCollection;

function ConstellationMap(props: IConstellationMapProps & WithStyles<typeof styles>) {
    const {
        classes,
        constellation,
        constellationName,
        objects,
        backgroundObjects = [],
        highlightedObjects = [],
        maxNumLabels,
        labelMode = "sac",
        width = "100%",
        height = defaultHeight,
        showControls = true,
        initialZoom = 1,
        allowZoom = true,
    } = props;

    const defaultMaxLabels = getDefaultMaxLabels(objects, highlightedObjects);
    const [activeLabelMode, setActiveLabelMode] = React.useState<ConstellationMapLabelMode>(labelMode);
    const [activeMaxLabels, setActiveMaxLabels] = React.useState(maxNumLabels ?? defaultMaxLabels);
    const [pan, setPan] = React.useState<PlanePan>({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [isDragging, setIsDragging] = React.useState(false);
    const [selectedObjectInfo, setSelectedObjectInfo] = React.useState<string | null>(null);
    const dragState = React.useRef<DragState | null>(null);
    const focusedBoundaryClipPathId = React.useId().replace(/:/g, "");

    React.useEffect(() => setActiveLabelMode(labelMode), [labelMode]);
    React.useEffect(() => setActiveMaxLabels(maxNumLabels ?? defaultMaxLabels), [maxNumLabels, defaultMaxLabels]);
    React.useEffect(() => {
        setPan({ x: 0, y: 0 });
        setZoom(clamp(initialZoom, minZoom, maxZoom));
        setSelectedObjectInfo(null);
    }, [constellation, initialZoom]);

    const constellationId = normalizeConstellationId(constellation);
    const focusedBoundaryFeatures = getConstellationFeatures(constellationBounds, constellationId);
    const focusedLineFeatures = getConstellationFeatures(constellationLines, constellationId);
    const focusedBoundaryRings = getPolygonRings(focusedBoundaryFeatures);
    const focusedLineSegments = getLineSegments(focusedLineFeatures);
    const focusedBoundaryPositions = focusedBoundaryRings.flat().map(toCelestialPosition);
    const extent = createMapExtent(focusedBoundaryPositions);

    if (extent == null) {
        return (
            <div className={classes.unavailable} style={{ width, minHeight: height }}>
                Map data is not available for {constellationName || constellation}.
            </div>
        );
    }

    const viewExtent = createViewExtent(extent, pan, zoom);
    const mapPadding = getMapPadding(height);
    const foregroundKeys = new Set([...objects, ...highlightedObjects].map(getMapObjectKey));
    const highlightedKeys = new Set(highlightedObjects.map(getMapObjectKey));
    const projectedBackgroundObjects = projectObjects(
        uniqueObjects(backgroundObjects).filter(object => !foregroundKeys.has(getMapObjectKey(object))),
        viewExtent,
        height,
        3,
        activeLabelMode,
        mapPadding);
    const projectedHighlightedObjects = projectObjects(uniqueObjects(highlightedObjects), viewExtent, height, 5, activeLabelMode, mapPadding);
    const projectedObjects = projectObjects(
        uniqueObjects(objects).filter(object => !highlightedKeys.has(getMapObjectKey(object))),
        viewExtent,
        height,
        4,
        activeLabelMode,
        mapPadding);
    const foregroundObjectCount = projectedHighlightedObjects.length + projectedObjects.length;
    const sliderMax = Math.max(1, foregroundObjectCount);
    const displayedMaxLabels = Math.min(activeMaxLabels, sliderMax);
    const showAllForegroundLabels = displayedMaxLabels >= foregroundObjectCount;
    const labelPlacements = foregroundObjectCount > 1
        ? selectLabelPlacements(projectedHighlightedObjects, projectedObjects, displayedMaxLabels, labelFontSize, viewBoxWidth, height, showAllForegroundLabels)
        : [];

    return (
        <div className={classes.root} style={{ width, minHeight: height }}>
            <div className={classes.plotContainer}>
                {renderPlot(
                    classes,
                    constellationId,
                    focusedBoundaryRings,
                    focusedLineSegments,
                    viewExtent,
                    extent,
                    height,
                    focusedBoundaryPositions,
                    projectedBackgroundObjects,
                    projectedObjects,
                    projectedHighlightedObjects,
                    labelPlacements,
                    mapPadding,
                    focusedBoundaryClipPathId,
                    allowZoom,
                    pan,
                    zoom,
                    isDragging,
                    setPan,
                    setZoom,
                    setSelectedObjectInfo,
                    setIsDragging,
                    dragState)}
            </div>
            {showControls && (
                <aside className={classes.controlsPanel}>
                    <Typography variant="overline" component="div" className={classes.controlsTitle}>
                        Map controls
                    </Typography>
                    <Typography variant="caption" component="div" className={classes.labelsCaption}>
                        Labels
                    </Typography>
                    <ToggleButtonGroup
                        exclusive={true}
                        fullWidth={true}
                        size="small"
                        value={activeLabelMode}
                        onChange={(_, value: ConstellationMapLabelMode | null) => {
                            if (value != null) {
                                setActiveLabelMode(value);
                            }
                        }}
                        aria-label="Constellation map label style"
                        className={classes.labelToggleGroup}
                    >
                        <ToggleButton value="herschel" className={classes.labelToggleButton}>
                            Herschel
                        </ToggleButton>
                        <ToggleButton value="sac" className={classes.labelToggleButton}>
                            SAC
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Typography variant="caption" component="div" className={classes.labelCount}>
                        Label count: {displayedMaxLabels}
                    </Typography>
                    <Slider
                        size="small"
                        min={0}
                        max={sliderMax}
                        step={1}
                        value={displayedMaxLabels}
                        onChange={(_, value) => setActiveMaxLabels(Array.isArray(value) ? value[0] : value)}
                        aria-label="Label count"
                        valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" component="div" className={classes.controlHelpText}>
                        Drag the map to pan. Use the mouse wheel to zoom.
                    </Typography>
                    <Typography variant="caption" component="div" className={classes.zoomText}>
                        Zoom: {zoom.toFixed(1)}x
                    </Typography>
                    {selectedObjectInfo && (
                        <div className={classes.selectedObjectInfo}>
                            {selectedObjectInfo}
                        </div>
                    )}
                </aside>
            )}
        </div>
    );
}

function renderPlot(
    classes: ConstellationMapClasses,
    focusedConstellationId: string,
    focusedBoundaryRings: RawCoordinate[][],
    focusedLineSegments: RawCoordinate[][],
    viewExtent: MapExtent,
    baseExtent: MapExtent,
    height: number,
    focusedBoundaryPositions: CelestialPosition[],
    projectedBackgroundObjects: ProjectedMapObject[],
    projectedObjects: ProjectedMapObject[],
    projectedHighlightedObjects: ProjectedMapObject[],
    labelPlacements: ReturnType<typeof selectLabelPlacements>,
    mapPadding: MapPadding,
    focusedBoundaryClipPathId: string,
    allowZoom: boolean,
    pan: PlanePan,
    zoom: number,
    isDragging: boolean,
    setPan: (pan: PlanePan) => void,
    setZoom: (zoom: number) => void,
    setSelectedObjectInfo: (objectInfo: string) => void,
    setIsDragging: (isDragging: boolean) => void,
    dragState: React.MutableRefObject<DragState | null>) {
    const surroundingBoundaryRings = getPolygonRings(constellationBounds.features.filter(feature => normalizeConstellationId(feature.id) !== focusedConstellationId));
    const surroundingLineSegments = getLineSegments(constellationLines.features.filter(feature => normalizeConstellationId(feature.id) !== focusedConstellationId));
    const gridSegments = createGridSegments(focusedBoundaryPositions);
    const focusedBoundaryFillPaths = focusedBoundaryRings
        .map(ring => coordinatesToPath(ring, viewExtent, height, true, mapPadding, true))
        .filter((path): path is string => path != null);

    return (
        <svg
            role="img"
            aria-label="Constellation map"
            width="100%"
            height={height}
            viewBox={`0 0 ${viewBoxWidth} ${height}`}
            onPointerDown={(event) => startDrag(event, pan, dragState, setIsDragging)}
            onPointerMove={(event) => continueDrag(event, viewExtent, baseExtent, height, mapPadding, dragState, setPan)}
            onPointerUp={(event) => stopDrag(event, dragState, setIsDragging)}
            onPointerCancel={(event) => stopDrag(event, dragState, setIsDragging)}
            onLostPointerCapture={(event) => stopDrag(event, dragState, setIsDragging)}
            onWheel={(event) => {
                if (allowZoom) {
                    zoomFromWheel(event, zoom, viewExtent, baseExtent, height, mapPadding, setZoom, setPan);
                }
            }}
            onDragStart={(event) => event.preventDefault()}
            className={`${classes.plotSvg} ${isDragging ? classes.plotSvgDragging : classes.plotSvgIdle}`}
        >
            <defs>
                <clipPath id={focusedBoundaryClipPathId} clipPathUnits="userSpaceOnUse">
                    {focusedBoundaryFillPaths.map((path, index) => (
                        <path key={`focused-boundary-clip-${index}`} d={path} />
                    ))}
                </clipPath>
            </defs>
            <rect x={0} y={0} width={viewBoxWidth} height={height} fill="#f4f4f4" />
            <g aria-hidden="true">
                {surroundingBoundaryRings.map((ring, index) => renderPath(ring, viewExtent, height, true, {
                    key: `surrounding-boundary-${index}`,
                    className: classes.surroundingBoundary,
                }, mapPadding))}
                {focusedBoundaryFillPaths.length > 0 && <rect x={0} y={0} width={viewBoxWidth} height={height} fill="#ffffff" clipPath={`url(#${focusedBoundaryClipPathId})`} />}
                {gridSegments.map((segment, index) => renderPath(segment, viewExtent, height, false, {
                    key: `grid-${index}`,
                    className: classes.gridLine,
                }, mapPadding))}
                {surroundingLineSegments.map((segment, index) => renderPath(segment, viewExtent, height, false, {
                    key: `surrounding-line-${index}`,
                    className: classes.surroundingLine,
                }, mapPadding))}
                {focusedBoundaryRings.map((ring, index) => renderPath(ring, viewExtent, height, true, {
                    key: `boundary-${index}`,
                    className: classes.focusedBoundary,
                }, mapPadding, true))}
                {focusedLineSegments.map((segment, index) => renderPath(segment, viewExtent, height, false, {
                    key: `line-${index}`,
                    className: classes.focusedLine,
                }, mapPadding))}
                {getUniqueLineVertices(surroundingLineSegments, viewExtent, height, mapPadding).map(vertex => (
                    <circle
                        key={`surrounding-vertex-${vertex.key}`}
                        cx={vertex.point.x}
                        cy={vertex.point.y}
                        r={1.6}
                        className={classes.surroundingVertex}
                    />
                ))}
                {getUniqueLineVertices(focusedLineSegments, viewExtent, height, mapPadding).map(vertex => (
                    <circle
                        key={`vertex-${vertex.key}`}
                        cx={vertex.point.x}
                        cy={vertex.point.y}
                        r={2.3}
                        className={classes.focusedVertex}
                    />
                ))}
            </g>
            <g>
                {projectedBackgroundObjects.map(object => renderCrosshair(object, "#b4b4b4", 4, 9))}
                {projectedObjects.map(object => renderCrosshair(object, "#0184bc", 4.5, 10))}
                {projectedHighlightedObjects.map(object => renderCrosshair(object, "#111111", 6, 12))}
            </g>
            <g>
                {labelPlacements.map(placement => renderObjectLabel(placement, setSelectedObjectInfo, classes.objectLabel))}
            </g>
        </svg>
    );
}

function getConstellationFeatures(collection: GeoJsonFeatureCollection, constellationId: string) {
    return collection.features.filter(feature => normalizeConstellationId(feature.id) === constellationId);
}

function getPolygonRings(features: GeoJsonFeature[]) {
    return features.flatMap(feature =>
        feature.geometry.type === "Polygon"
            ? feature.geometry.coordinates as RawCoordinate[][]
            : []);
}

function getLineSegments(features: GeoJsonFeature[]) {
    return features.flatMap(feature =>
        feature.geometry.type === "MultiLineString"
            ? feature.geometry.coordinates as RawCoordinate[][]
            : []);
}

function toCelestialPosition(coordinate: RawCoordinate): CelestialPosition {
    return {
        longitude: normalizeLongitude(coordinate[0]),
        latitude: coordinate[1],
    };
}

function renderPath(coordinates: RawCoordinate[], extent: MapExtent, height: number, close: boolean, props: React.SVGProps<SVGPathElement>, padding: MapPadding, allowOffscreenPath = false) {
    const path = coordinatesToPath(coordinates, extent, height, close, padding, allowOffscreenPath);
    if (path == null) {
        return null;
    }

    return <path {...props} d={path} />;
}

function coordinatesToPath(coordinates: RawCoordinate[], extent: MapExtent, height: number, close: boolean, padding: MapPadding, allowOffscreenPath: boolean) {
    const commands: string[] = [];
    let isDrawingSegment = false;
    let hasGap = false;
    let hasNearPoint = false;
    let segmentPointCount = 0;

    coordinates.forEach(coordinate => {
        const point = projectCoordinate(coordinate, extent, height, padding);
        if (point == null) {
            hasGap = true;
            isDrawingSegment = false;
            segmentPointCount = 0;
            return;
        }

        if (isNearViewBox(point, height)) {
            hasNearPoint = true;
        }

        commands.push(`${isDrawingSegment ? "L" : "M"}${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`);
        isDrawingSegment = true;
        segmentPointCount++;
    });

    if (commands.length < 2 || (!allowOffscreenPath && !hasNearPoint)) {
        return null;
    }

    const path = commands.join(" ");

    return close && !hasGap && segmentPointCount >= 2 ? `${path} Z` : path;
}

function projectCoordinate(coordinate: RawCoordinate, extent: MapExtent, height: number, padding: MapPadding) {
    return projectPosition(toCelestialPosition(coordinate), extent, viewBoxWidth, height, padding.x, padding.y);
}

function projectObjects(
    objects: IConstellationMapObject[],
    extent: MapExtent,
    height: number,
    markerRadius: number,
    labelMode: ConstellationMapLabelMode,
    padding: MapPadding): ProjectedMapObject[] {
    return objects.flatMap(object => {
        const position = parseMapObjectPosition(object);
        if (position == null) {
            return [];
        }

        const projected = projectPosition(position, extent, viewBoxWidth, height, padding.x, padding.y);
        if (projected == null) {
            return [];
        }

        return [{
            ...projected,
            key: getMapObjectKey(object),
            label: formatMapObjectLabel(object, labelMode),
            markerRadius,
            object,
        }];
    });
}

function uniqueObjects(objects: IConstellationMapObject[]) {
    const seen = new Set<string>();
    return objects.filter(object => {
        const key = getMapObjectKey(object);
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getDefaultMaxLabels(objects: IConstellationMapObject[], highlightedObjects: IConstellationMapObject[]) {
    const uniqueHighlightedObjects = uniqueObjects(highlightedObjects);
    const highlightedKeys = new Set(uniqueHighlightedObjects.map(getMapObjectKey));
    const uniqueNormalObjects = uniqueObjects(objects).filter(object => !highlightedKeys.has(getMapObjectKey(object)));

    // With no explicit max, label every foreground object; background detections stay unlabeled.
    return uniqueHighlightedObjects.length + uniqueNormalObjects.length;
}

function getUniqueLineVertices(lineSegments: RawCoordinate[][], extent: MapExtent, height: number, padding: MapPadding) {
    const vertices = new Map<string, { key: string; point: ProjectedPoint }>();
    lineSegments.forEach(segment => {
        segment.forEach(coordinate => {
            const point = projectCoordinate(coordinate, extent, height, padding);
            if (point == null || !isNearViewBox(point, height)) {
                return;
            }

            const key = `${coordinate[0].toFixed(4)},${coordinate[1].toFixed(4)}`;
            if (!vertices.has(key)) {
                vertices.set(key, { key, point });
            }
        });
    });

    return Array.from(vertices.values());
}

function createGridSegments(focusedBoundaryPositions: CelestialPosition[]) {
    const latitudes = focusedBoundaryPositions.map(point => point.latitude);
    const minLatitude = Math.max(-89, Math.min(...latitudes) - 20);
    const maxLatitude = Math.min(89, Math.max(...latitudes) + 20);
    const latitudeStart = Math.floor(minLatitude / 5) * 5;
    const latitudeEnd = Math.ceil(maxLatitude / 5) * 5;
    const segments: RawCoordinate[][] = [];

    for (let longitude = -180; longitude < 180; longitude += 15) {
        const segment: RawCoordinate[] = [];
        for (let latitude = -89; latitude <= 89; latitude += 2) {
            segment.push([normalizeLongitude(longitude), latitude]);
        }
        segments.push(segment);
    }

    for (let latitude = latitudeStart; latitude <= latitudeEnd; latitude += 5) {
        const segment: RawCoordinate[] = [];
        for (let longitude = -180; longitude <= 180; longitude += 2) {
            segment.push([normalizeLongitude(longitude), latitude]);
        }
        segments.push(segment);
    }

    return segments;
}

function renderCrosshair(object: ProjectedMapObject, stroke: string, radius: number, hitRadius: number) {
    return (
        <Tooltip
            key={object.key}
            title={getObjectTooltip(object.object)}
            enterDelay={75}
            enterNextDelay={0}
            leaveDelay={0}
            disableInteractive={true}
            arrow={true}
        >
            <g>
                <line x1={object.x - radius} y1={object.y} x2={object.x + radius} y2={object.y} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
                <line x1={object.x} y1={object.y - radius} x2={object.x} y2={object.y + radius} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
                <circle
                    cx={object.x}
                    cy={object.y}
                    r={hitRadius}
                    fill="transparent"
                    stroke="none"
                    pointerEvents="all"
                />
            </g>
        </Tooltip>
    );
}

function renderObjectLabel(placement: ReturnType<typeof selectLabelPlacements>[number], setSelectedObjectInfo: (objectInfo: string) => void, labelClassName: string) {
    const object = (placement.candidate as ProjectedMapObject).object;
    const tooltip = getObjectTooltip(object);
    return (
        <Tooltip
            key={`label-${placement.key}`}
            title={tooltip}
            enterDelay={75}
            enterNextDelay={0}
            leaveDelay={0}
            disableInteractive={true}
            arrow={true}
        >
            <text
                x={placement.textX}
                y={placement.textY}
                textAnchor="middle"
                className={labelClassName}
                pointerEvents="all"
                onPointerDown={event => event.stopPropagation()}
                onClick={event => {
                    event.stopPropagation();
                    setSelectedObjectInfo(tooltip);
                }}
            >
                {placement.label}
            </text>
        </Tooltip>
    );
}

function getObjectTooltip(object: IConstellationMapObject) {
    const sacName = formatMapObjectLabel(object, "sac");
    return object.herschelNo ? `${sacName} / ${object.herschelNo}` : sacName;
}

function isNearViewBox(point: ProjectedPoint, height: number) {
    const margin = 80;
    return point.x >= -margin &&
        point.x <= viewBoxWidth + margin &&
        point.y >= -margin &&
        point.y <= height + margin;
}

function formatSvgNumber(value: number) {
    return value.toFixed(2);
}

function createViewExtent(baseExtent: MapExtent, pan: PlanePan, zoom: number): MapExtent {
    const baseCenterX = (baseExtent.minPlaneX + baseExtent.maxPlaneX) / 2;
    const baseCenterY = (baseExtent.minPlaneY + baseExtent.maxPlaneY) / 2;
    const baseSpanX = baseExtent.maxPlaneX - baseExtent.minPlaneX;
    const baseSpanY = baseExtent.maxPlaneY - baseExtent.minPlaneY;
    const viewSpanX = baseSpanX / zoom;
    const viewSpanY = baseSpanY / zoom;
    const centerX = baseCenterX + pan.x;
    const centerY = baseCenterY + pan.y;

    return {
        ...baseExtent,
        minPlaneX: centerX - viewSpanX / 2,
        maxPlaneX: centerX + viewSpanX / 2,
        minPlaneY: centerY - viewSpanY / 2,
        maxPlaneY: centerY + viewSpanY / 2,
    };
}

function startDrag(
    event: React.PointerEvent<SVGSVGElement>,
    pan: PlanePan,
    dragState: React.MutableRefObject<DragState | null>,
    setIsDragging: (isDragging: boolean) => void) {
    if (event.button !== 0 || !event.isPrimary) {
        return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPan: pan,
    };
    setIsDragging(true);
}

function continueDrag(
    event: React.PointerEvent<SVGSVGElement>,
    viewExtent: MapExtent,
    baseExtent: MapExtent,
    height: number,
    padding: MapPadding,
    dragState: React.MutableRefObject<DragState | null>,
    setPan: (pan: PlanePan) => void) {
    const drag = dragState.current;
    if (drag == null || drag.pointerId !== event.pointerId) {
        return;
    }

    event.preventDefault();
    const scaleData = getProjectionScaleData(viewExtent, height, padding);
    const deltaX = (event.clientX - drag.startClientX) / scaleData.scale;
    const deltaY = (event.clientY - drag.startClientY) / scaleData.scale;
    const nextPan = clampPan({ x: drag.startPan.x - deltaX, y: drag.startPan.y + deltaY }, baseExtent);
    setPan(nextPan);
}

function stopDrag(
    event: React.PointerEvent<SVGSVGElement>,
    dragState: React.MutableRefObject<DragState | null>,
    setIsDragging: (isDragging: boolean) => void) {
    if (dragState.current != null && dragState.current.pointerId === event.pointerId) {
        dragState.current = null;
        setIsDragging(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
    }
}

function zoomFromWheel(
    event: React.WheelEvent<SVGSVGElement>,
    zoom: number,
    viewExtent: MapExtent,
    baseExtent: MapExtent,
    height: number,
    padding: MapPadding,
    setZoom: (zoom: number) => void,
    setPan: (pan: PlanePan) => void) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.14 : 1 / 1.14;
    const nextZoom = clamp(zoom * factor, minZoom, maxZoom);
    const planePoint = svgPointToPlane(event, viewExtent, height, padding);
    if (planePoint == null || nextZoom === zoom) {
        setZoom(nextZoom);
        return;
    }

    const baseCenterX = (baseExtent.minPlaneX + baseExtent.maxPlaneX) / 2;
    const baseCenterY = (baseExtent.minPlaneY + baseExtent.maxPlaneY) / 2;
    const currentCenterX = (viewExtent.minPlaneX + viewExtent.maxPlaneX) / 2;
    const currentCenterY = (viewExtent.minPlaneY + viewExtent.maxPlaneY) / 2;
    const zoomRatio = zoom / nextZoom;
    const anchoredCenterX = planePoint.x - (planePoint.x - currentCenterX) * zoomRatio;
    const anchoredCenterY = planePoint.y - (planePoint.y - currentCenterY) * zoomRatio;

    setZoom(nextZoom);
    setPan(clampPan({ x: anchoredCenterX - baseCenterX, y: anchoredCenterY - baseCenterY }, baseExtent));
}

function svgPointToPlane(event: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement> | React.WheelEvent<SVGSVGElement>, extent: MapExtent, height: number, padding: MapPadding) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return null;
    }

    const svgX = (event.clientX - rect.left) / rect.width * viewBoxWidth;
    const svgY = (event.clientY - rect.top) / rect.height * height;
    const scaleData = getProjectionScaleData(extent, height, padding);

    return {
        x: extent.minPlaneX + (svgX - scaleData.xOffset) / scaleData.scale,
        y: extent.maxPlaneY - (svgY - scaleData.yOffset) / scaleData.scale,
    };
}

function getProjectionScaleData(extent: MapExtent, height: number, padding: MapPadding) {
    const planeSpanX = Math.max(0.001, extent.maxPlaneX - extent.minPlaneX);
    const planeSpanY = Math.max(0.001, extent.maxPlaneY - extent.minPlaneY);
    const drawableWidth = Math.max(1, viewBoxWidth - padding.x * 2);
    const drawableHeight = Math.max(1, height - padding.y * 2);
    const scale = Math.min(drawableWidth / planeSpanX, drawableHeight / planeSpanY);
    const usedWidth = planeSpanX * scale;
    const usedHeight = planeSpanY * scale;

    return {
        scale,
        xOffset: (viewBoxWidth - usedWidth) / 2,
        yOffset: (height - usedHeight) / 2,
    };
}

function getMapPadding(height: number): MapPadding {
    return {
        x: viewBoxWidth * boundaryPaddingRatio,
        y: height * boundaryPaddingRatio,
    };
}

function clampPan(pan: PlanePan, baseExtent: MapExtent) {
    const baseSpanX = baseExtent.maxPlaneX - baseExtent.minPlaneX;
    const baseSpanY = baseExtent.maxPlaneY - baseExtent.minPlaneY;

    return {
        x: clamp(pan.x, -baseSpanX * 0.6, baseSpanX * 0.6),
        y: clamp(pan.y, -baseSpanY * 0.6, baseSpanY * 0.6),
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export default withStyles(styles)(ConstellationMap);
