import * as React from "react";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import { useLabelVisibility, setLabelVisibilityEnabled, toggleHiddenLabel, toggleHiddenLabels, resetHiddenLabels } from "../store/LabelVisibilityStore";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import { InterstellarumChart } from "./InterstellarumAtlas";
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
    chart?: InterstellarumChart;
    constellation: string;
    constellationName?: string;
    objects: IConstellationMapObject[];
    backgroundObjects?: IConstellationMapObject[];
    highlightedObjects?: IConstellationMapObject[];
    objectLabel?: string;
    backgroundLabel?: string;
    highlightedLabel?: string;
    maxNumLabels?: number;
    labelMode?: ConstellationMapLabelMode;
    /** Label a lone object in overview maps; locator maps keep it unlabeled. */
    labelSingleObject?: boolean;
    /** Include observed background objects in the label budget for overview maps. */
    showBackgroundLabels?: boolean;
    /** Enable persistent label toggling only for the statistics constellation dialog. */
    enableLabelVisibilityFilter?: boolean;
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

const fallbackViewBoxWidth = 1000;
const defaultHeight = 420;
const boundaryPaddingRatio = 0.02;
const labelFontSize = 12;
const minZoom = 1.0;
const maxZoom = 6;
type ConstellationMapMarkerKind = "background" | "normal" | "highlighted";

const styles = (theme: Theme) => createStyles({
    root: {
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
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
        background: theme.palette.mode === "dark" ? "#111820" : "#f4f4f4",
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
        stroke: theme.palette.mode === "dark" ? "#314052" : "#d1d1d1",
        strokeDasharray: "5 4",
        strokeWidth: 0.9,
    },
    gridLine: {
        fill: "none",
        stroke: theme.palette.mode === "dark" ? "#263444" : "#cfcfcf",
        strokeWidth: 0.8,
    },
    surroundingLine: {
        fill: "none",
        stroke: theme.palette.mode === "dark" ? "#384759" : "#c2c2c2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.1,
    },
    focusedBoundary: {
        fill: "none",
        stroke: theme.palette.mode === "dark" ? "#93a4b8" : "#626262",
        strokeDasharray: "6 4",
        strokeWidth: 1.5,
    },
    focusedLine: {
        fill: "none",
        stroke: theme.palette.mode === "dark" ? "#a6b5c6" : "#777777",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.6,
    },
    surroundingVertex: {
        fill: theme.palette.mode === "dark" ? "#596b80" : "#b2b2b2",
    },
    focusedVertex: {
        fill: theme.palette.mode === "dark" ? "#b9c6d6" : "#666666",
    },
    objectLabel: {
        cursor: "pointer",
        fill: theme.palette.primary.main,
        fontFamily: "'Trebuchet MS', Verdana, sans-serif",
        fontSize: labelFontSize,
        paintOrder: "stroke",
        stroke: theme.palette.mode === "dark" ? "#0d1117" : "#ffffff",
        strokeWidth: 2.2,
    },
    backgroundObjectLabel: {
        fill: theme.palette.mode === "dark" ? "#6f7d8f" : "#b4b4b4",
    },
    controlsPanel: {
        background: theme.palette.mode === "dark" ? "#161b22" : "#ececec",
        borderLeft: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        flex: "0 0 194px",
        padding: "18px 16px",
    },
    controlsTitle: {
        color: theme.palette.text.primary,
        letterSpacing: 1.2,
    },
    labelsCaption: {
        color: theme.palette.text.secondary,
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
        color: theme.palette.text.secondary,
    },
    controlHelpText: {
        color: theme.palette.text.secondary,
        lineHeight: 1.35,
        marginTop: theme.spacing(2.25),
    },
    zoomText: {
        color: theme.palette.text.secondary,
        marginTop: theme.spacing(1),
    },
    markerVisibilityCaption: {
        color: theme.palette.text.secondary,
        marginBottom: theme.spacing(0.25),
        marginTop: theme.spacing(1.5),
    },
    markerVisibilityControl: {
        display: "block",
        marginLeft: -6,
        marginRight: 0,
        "& .MuiFormControlLabel-label": {
            color: theme.palette.text.primary,
            fontSize: 12,
        },
    },
    // Separate persistent label preferences from marker visibility using the existing compact control sizes.
    labelVisibilitySection: {
        marginTop: theme.spacing(2),
    },
    resetLabelsButton: {
        marginTop: theme.spacing(1),
        fontSize: 11,
        lineHeight: 1.15,
        minHeight: 24,
        padding: "2px 6px",
        textTransform: "none",
    },
    markerVisibilityCheckbox: {
        paddingBottom: 2,
        paddingTop: 2,
    },
    plotBackground: {
        fill: theme.palette.mode === "dark" ? "#111820" : "#f4f4f4",
    },
    focusedBoundaryFill: {
        fill: theme.palette.mode === "dark" ? "#0d1117" : "#ffffff",
    },
    backgroundObjectMarker: {
        stroke: theme.palette.mode === "dark" ? "#6f7d8f" : "#b4b4b4",
    },
    normalObjectMarker: {
        stroke: theme.palette.primary.main,
    },
    highlightedObjectMarker: {
        stroke: theme.palette.mode === "dark" ? "#f0f6fc" : "#111111",
    },
    transparentHitArea: {
        fill: "transparent",
        stroke: "none",
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
        objectLabel = "Objects",
        backgroundLabel = "Background objects",
        highlightedLabel = "Highlighted objects",
        maxNumLabels,
        labelMode = "sac",
        labelSingleObject = false,
        showBackgroundLabels = false,
        enableLabelVisibilityFilter = false,
        width = "100%",
        height = defaultHeight,
        showControls = true,
        initialZoom = 1,
        allowZoom = true,
    } = props;

    const defaultMaxLabels = getDefaultMaxLabels(objects, highlightedObjects, showBackgroundLabels ? backgroundObjects : []);
    const [activeLabelMode, setActiveLabelMode] = React.useState<ConstellationMapLabelMode>(labelMode);
    const [activeMaxLabels, setActiveMaxLabels] = React.useState(maxNumLabels ?? defaultMaxLabels);
    const [pan, setPan] = React.useState<PlanePan>({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [isDragging, setIsDragging] = React.useState(false);
    const labelVisibility = useLabelVisibility();
    // Both labels and marker hit areas toggle the same stored catalog identity.
    const toggleObjectLabel = (object: IConstellationMapObject) => {
        if (enableLabelVisibilityFilter) { toggleHiddenLabel(constellation, getMapObjectKey(object)); }
    };
    const [visibleMarkers, setVisibleMarkers] = React.useState<Record<ConstellationMapMarkerKind, boolean>>({
        background: true,
        normal: true,
        highlighted: true,
    });
    const plotContainerRef = React.useRef<HTMLDivElement | null>(null);
    const measuredPlotWidth = useElementWidth(plotContainerRef);
    const dragState = React.useRef<DragState | null>(null);
    const focusedBoundaryClipPathId = React.useId().replace(/:/g, "");
    const markerVisibilityOptions = getMarkerVisibilityOptions(objectLabel, backgroundLabel, highlightedLabel);

    React.useEffect(() => setActiveLabelMode(labelMode), [labelMode]);
    React.useEffect(() => setActiveMaxLabels(maxNumLabels ?? defaultMaxLabels), [maxNumLabels, defaultMaxLabels]);
    React.useEffect(() => {
        setPan({ x: 0, y: 0 });
        setZoom(clamp(initialZoom, minZoom, maxZoom));
    }, [constellation, initialZoom]);

    const constellationId = normalizeConstellationId(constellation);
    const focusedBoundaryFeatures = getConstellationFeatures(constellationBounds, constellationId);
    const focusedLineFeatures = getConstellationFeatures(constellationLines, constellationId);
    // Chart boundaries retain separate leaf rings so their overlap renders as a union.
    const focusedBoundaryRings = props.chart
        ? props.chart.pages.map(page => page.boundary_ra_dec_deg as RawCoordinate[])
        : getPolygonRings(focusedBoundaryFeatures);
    const focusedLineSegments = props.chart ? [] : getLineSegments(focusedLineFeatures);
    const focusedBoundaryPositions = focusedBoundaryRings.flat().map(toCelestialPosition);
    const extent = createMapExtent(focusedBoundaryPositions);

    if (extent == null) {
        return (
            <div className={classes.unavailable} style={{ width, minHeight: height }}>
                Map data is not available for {constellationName || constellation}.
            </div>
        );
    }

    const viewBoxWidth = measuredPlotWidth ?? fallbackViewBoxWidth;
    const viewExtent = createViewExtent(extent, pan, zoom);
    const mapPadding = getMapPadding(viewBoxWidth, height);
    const foregroundKeys = new Set([...objects, ...highlightedObjects].map(getMapObjectKey));
    const highlightedKeys = new Set(highlightedObjects.map(getMapObjectKey));
    const visibleBackgroundObjects = visibleMarkers.background ? backgroundObjects : [];
    const visibleNormalObjects = visibleMarkers.normal ? objects : [];
    const visibleHighlightedObjects = visibleMarkers.highlighted ? highlightedObjects : [];
    // Bulk changes follow marker checkboxes and the same group precedence as marker rendering.
    const toggleLabelKeys = uniqueObjects([
        ...visibleHighlightedObjects,
        ...visibleNormalObjects.filter(object => !highlightedKeys.has(getMapObjectKey(object))),
        ...visibleBackgroundObjects.filter(object => !foregroundKeys.has(getMapObjectKey(object))),
    ]).map(getMapObjectKey);
    const projectedBackgroundObjects = projectObjects(
        uniqueObjects(visibleBackgroundObjects).filter(object => !foregroundKeys.has(getMapObjectKey(object))),
        viewExtent,
        viewBoxWidth,
        height,
        3,
        activeLabelMode,
        mapPadding);
    const projectedHighlightedObjects = projectObjects(uniqueObjects(visibleHighlightedObjects), viewExtent, viewBoxWidth, height, 5, activeLabelMode, mapPadding);
    const projectedObjects = projectObjects(
        uniqueObjects(visibleNormalObjects).filter(object => !highlightedKeys.has(getMapObjectKey(object))),
        viewExtent,
        viewBoxWidth,
        height,
        4,
        activeLabelMode,
        mapPadding);
    // Overview maps label observed objects too, using the same slider and collision placement.
    const labelCandidates = [...projectedObjects, ...(showBackgroundLabels ? projectedBackgroundObjects : [])];
    const labelObjectCount = projectedHighlightedObjects.length + labelCandidates.length;
    const sliderMax = Math.max(1, labelObjectCount);
    const displayedMaxLabels = Math.min(activeMaxLabels, sliderMax);
    const showAllLabels = displayedMaxLabels >= labelObjectCount;
    const labelPlacements = labelObjectCount > 1 || (labelSingleObject && labelObjectCount === 1)
        ? selectLabelPlacements(projectedHighlightedObjects, labelCandidates, displayedMaxLabels, labelFontSize, viewBoxWidth, height, showAllLabels)
        : [];

    // Apply the manual filter after default placement so hiding a label does not replace it with a different one.
    const hiddenLabels = new Set(labelVisibility.hiddenByConstellation[constellationId] || []);
    const filteredPlacements = enableLabelVisibilityFilter && labelVisibility.enabled
        ? labelPlacements.filter(placement => !hiddenLabels.has(placement.key)) : labelPlacements;

    return (
        <div className={classes.root} style={{ width, minHeight: height }}>
            <div className={classes.plotContainer} ref={plotContainerRef}>
                {renderPlot(
                    classes,
                    constellationId,
                    focusedBoundaryRings,
                    focusedLineSegments,
                    viewExtent,
                    extent,
                    viewBoxWidth,
                    height,
                    focusedBoundaryPositions,
                    projectedBackgroundObjects,
                    projectedObjects,
                    projectedHighlightedObjects,
                    filteredPlacements,
                    mapPadding,
                    focusedBoundaryClipPathId,
                    allowZoom,
                    pan,
                    zoom,
                    isDragging,
                    setPan,
                    setZoom,
                    toggleObjectLabel,
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
                        <ToggleButton value="sac" className={classes.labelToggleButton}>
                            SAC
                        </ToggleButton>
                        <ToggleButton value="herschel" className={classes.labelToggleButton}>
                            Herschel
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
                    <Typography variant="caption" component="div" className={classes.markerVisibilityCaption}>
                        Markers
                    </Typography>
                    {markerVisibilityOptions.map(option => (
                        <FormControlLabel
                            key={option.kind}
                            className={classes.markerVisibilityControl}
                            control={
                                <Checkbox
                                    className={classes.markerVisibilityCheckbox}
                                    size="small"
                                    checked={visibleMarkers[option.kind]}
                                    onChange={(_, checked) => setMarkerVisibility(option.kind, checked, setVisibleMarkers)}
                                />
                            }
                            label={option.label}
                        />
                    ))}
                    {enableLabelVisibilityFilter && (
                        <div className={classes.labelVisibilitySection}>
                            <FormControlLabel
                                className={classes.markerVisibilityControl}
                                control={<Switch size="small" checked={labelVisibility.enabled} onChange={(_, checked) => setLabelVisibilityEnabled(checked)} />}
                                label="Label visibility filter"
                            />
                            {/* Hide or restore all labels in checked marker groups, retaining unchecked groups unchanged. */}
                            <Button className={classes.resetLabelsButton} variant="outlined" size="small" fullWidth={true}
                                disabled={!labelVisibility.enabled || toggleLabelKeys.length === 0}
                                onClick={() => toggleHiddenLabels(constellation, toggleLabelKeys)}
                                title="Hide or show all labels in the checked marker groups">
                                Toggle labels
                            </Button>
                            <Button className={classes.resetLabelsButton} variant="outlined" size="small" fullWidth={true} onClick={() => resetHiddenLabels(constellation)} title={props.chart ? "Reset hidden labels in this chart" : "Reset hidden labels in this constellation"}>
                                Reset labels
                            </Button>
                        </div>
                    )}
                </aside>
            )}
        </div>
    );
}

// Builds the controls in the same order as the map's public marker-label props.
function getMarkerVisibilityOptions(objectLabel: string, backgroundLabel: string, highlightedLabel: string): Array<{ kind: ConstellationMapMarkerKind; label: string }> {
    return [
        { kind: "highlighted", label: highlightedLabel },
        { kind: "normal", label: objectLabel },
        { kind: "background", label: backgroundLabel },
    ];
}

// Keeps each marker checkbox isolated while preserving the other marker visibility settings.
function setMarkerVisibility(
    markerKind: ConstellationMapMarkerKind,
    isVisible: boolean,
    setVisibleMarkers: React.Dispatch<React.SetStateAction<Record<ConstellationMapMarkerKind, boolean>>>) {
    setVisibleMarkers(current => ({
        ...current,
        [markerKind]: isVisible,
    }));
}

function renderPlot(
    classes: ConstellationMapClasses,
    focusedConstellationId: string,
    focusedBoundaryRings: RawCoordinate[][],
    focusedLineSegments: RawCoordinate[][],
    viewExtent: MapExtent,
    baseExtent: MapExtent,
    viewBoxWidth: number,
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
    toggleObjectLabel: (object: IConstellationMapObject) => void,
    setIsDragging: (isDragging: boolean) => void,
    dragState: React.MutableRefObject<DragState | null>) {
    const surroundingBoundaryRings = getPolygonRings(constellationBounds.features.filter(feature => normalizeConstellationId(feature.id) !== focusedConstellationId));
    const surroundingLineSegments = getLineSegments(constellationLines.features.filter(feature => normalizeConstellationId(feature.id) !== focusedConstellationId));
    const gridSegments = createGridSegments(focusedBoundaryPositions);
    const focusedBoundaryFillPaths = focusedBoundaryRings
        .map(ring => coordinatesToPath(ring, viewExtent, viewBoxWidth, height, true, mapPadding, true))
        .filter((path): path is string => path != null);

    return (
        <svg
            role="img"
            aria-label={focusedConstellationId.startsWith("INTERSTELLARUM-") ? "Interstellarum chart map" : "Constellation map"}
            width="100%"
            height={height}
            viewBox={`0 0 ${viewBoxWidth} ${height}`}
            onPointerDown={(event) => startDrag(event, pan, dragState, setIsDragging)}
            onPointerMove={(event) => continueDrag(event, viewExtent, baseExtent, viewBoxWidth, height, mapPadding, dragState, setPan)}
            onPointerUp={(event) => stopDrag(event, dragState, setIsDragging)}
            onPointerCancel={(event) => stopDrag(event, dragState, setIsDragging)}
            onLostPointerCapture={(event) => stopDrag(event, dragState, setIsDragging)}
            onWheel={(event) => {
                if (allowZoom) {
                    zoomFromWheel(event, zoom, viewExtent, baseExtent, viewBoxWidth, height, mapPadding, setZoom, setPan);
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
            <rect x={0} y={0} width={viewBoxWidth} height={height} className={classes.plotBackground} data-map-layer="background" />
            <g aria-hidden="true">
                {surroundingBoundaryRings.map((ring, index) => renderPath(ring, viewExtent, viewBoxWidth, height, true, {
                    key: `surrounding-boundary-${index}`,
                    className: classes.surroundingBoundary,
                }, mapPadding))}
                {focusedBoundaryFillPaths.length > 0 && <rect x={0} y={0} width={viewBoxWidth} height={height} className={classes.focusedBoundaryFill} data-map-layer="focused-fill" clipPath={`url(#${focusedBoundaryClipPathId})`} />}
                {gridSegments.map((segment, index) => renderPath(segment, viewExtent, viewBoxWidth, height, false, {
                    key: `grid-${index}`,
                    className: classes.gridLine,
                }, mapPadding))}
                {surroundingLineSegments.map((segment, index) => renderPath(segment, viewExtent, viewBoxWidth, height, false, {
                    key: `surrounding-line-${index}`,
                    className: classes.surroundingLine,
                }, mapPadding))}
                {focusedBoundaryRings.map((ring, index) => renderPath(ring, viewExtent, viewBoxWidth, height, true, {
                    key: `boundary-${index}`,
                    className: classes.focusedBoundary,
                }, mapPadding, true))}
                {focusedLineSegments.map((segment, index) => renderPath(segment, viewExtent, viewBoxWidth, height, false, {
                    key: `line-${index}`,
                    className: classes.focusedLine,
                }, mapPadding))}
                {getUniqueLineVertices(surroundingLineSegments, viewExtent, viewBoxWidth, height, mapPadding).map(vertex => (
                    <circle
                        key={`surrounding-vertex-${vertex.key}`}
                        cx={vertex.point.x}
                        cy={vertex.point.y}
                        r={1.6}
                        className={classes.surroundingVertex}
                    />
                ))}
                {getUniqueLineVertices(focusedLineSegments, viewExtent, viewBoxWidth, height, mapPadding).map(vertex => (
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
                {projectedBackgroundObjects.map(object => renderCrosshair(object, "background", classes.backgroundObjectMarker, classes.transparentHitArea, 4, 9, toggleObjectLabel))}
                {projectedObjects.map(object => renderCrosshair(object, "normal", classes.normalObjectMarker, classes.transparentHitArea, 4.5, 10, toggleObjectLabel))}
                {projectedHighlightedObjects.map(object => renderCrosshair(object, "highlighted", classes.highlightedObjectMarker, classes.transparentHitArea, 6, 12, toggleObjectLabel))}
            </g>
            <g>
                {labelPlacements.map(placement => renderObjectLabel(
                    placement,
                    toggleObjectLabel,
                    `${classes.objectLabel} ${projectedBackgroundObjects.some(object => object.key === placement.key) ? classes.backgroundObjectLabel : ""}`))}
            </g>
        </svg>
    );
}

// Observes the plot container so the SVG projection uses the real viewport instead of a fixed aspect ratio.
function useElementWidth(elementRef: React.RefObject<HTMLElement | null>) {
    const [width, setWidth] = React.useState<number | null>(null);

    React.useLayoutEffect(() => {
        const element = elementRef.current;
        if (element == null || typeof ResizeObserver === "undefined") {
            return;
        }

        const updateWidth = (nextWidth: number) => {
            if (nextWidth > 0) {
                setWidth(Math.round(nextWidth));
            }
        };
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry != null) {
                updateWidth(entry.contentRect.width);
            }
        });

        updateWidth(element.getBoundingClientRect().width);
        observer.observe(element);

        return () => observer.disconnect();
    }, [elementRef]);

    return width;
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

function renderPath(coordinates: RawCoordinate[], extent: MapExtent, viewBoxWidth: number, height: number, close: boolean, props: React.SVGProps<SVGPathElement>, padding: MapPadding, allowOffscreenPath = false) {
    const path = coordinatesToPath(coordinates, extent, viewBoxWidth, height, close, padding, allowOffscreenPath);
    if (path == null) {
        return null;
    }

    return <path {...props} d={path} />;
}

function coordinatesToPath(coordinates: RawCoordinate[], extent: MapExtent, viewBoxWidth: number, height: number, close: boolean, padding: MapPadding, allowOffscreenPath: boolean) {
    const commands: string[] = [];
    let isDrawingSegment = false;
    let hasGap = false;
    let hasNearPoint = false;
    let segmentPointCount = 0;

    coordinates.forEach(coordinate => {
        const point = projectCoordinate(coordinate, extent, viewBoxWidth, height, padding);
        if (point == null) {
            hasGap = true;
            isDrawingSegment = false;
            segmentPointCount = 0;
            return;
        }

        if (isNearViewBox(point, viewBoxWidth, height)) {
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

function projectCoordinate(coordinate: RawCoordinate, extent: MapExtent, viewBoxWidth: number, height: number, padding: MapPadding) {
    return projectPosition(toCelestialPosition(coordinate), extent, viewBoxWidth, height, padding.x, padding.y);
}

function projectObjects(
    objects: IConstellationMapObject[],
    extent: MapExtent,
    viewBoxWidth: number,
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

// Count each eligible object once so overview maps default to labels for all three groups.
function getDefaultMaxLabels(objects: IConstellationMapObject[], highlightedObjects: IConstellationMapObject[], backgroundObjects: IConstellationMapObject[]) {
    return uniqueObjects([...highlightedObjects, ...objects, ...backgroundObjects]).length;
}

function getUniqueLineVertices(lineSegments: RawCoordinate[][], extent: MapExtent, viewBoxWidth: number, height: number, padding: MapPadding) {
    const vertices = new Map<string, { key: string; point: ProjectedPoint }>();
    lineSegments.forEach(segment => {
        segment.forEach(coordinate => {
            const point = projectCoordinate(coordinate, extent, viewBoxWidth, height, padding);
            if (point == null || !isNearViewBox(point, viewBoxWidth, height)) {
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

// Emphasize highlighted targets with a thicker cross in both overview and locator maps.
function renderCrosshair(object: ProjectedMapObject, markerKind: ConstellationMapMarkerKind, markerClassName: string, hitAreaClassName: string, radius: number, hitRadius: number, toggleObjectLabel: (object: IConstellationMapObject) => void) {
    const strokeWidth = markerKind === "highlighted" ? 3 : 1.8;
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
            <g
                onPointerDown={event => event.stopPropagation()}
                onClick={event => toggleMapObjectLabel(event, object.object, toggleObjectLabel)}
            >
                <line x1={object.x - radius} y1={object.y} x2={object.x + radius} y2={object.y} className={markerClassName} data-marker-kind={markerKind} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1={object.x} y1={object.y - radius} x2={object.x} y2={object.y + radius} className={markerClassName} data-marker-kind={markerKind} strokeWidth={strokeWidth} strokeLinecap="round" />
                <circle
                    cx={object.x}
                    cy={object.y}
                    r={hitRadius}
                    className={hitAreaClassName}
                    pointerEvents="all"
                />
            </g>
        </Tooltip>
    );
}

// Render clickable labels through the same filter path as the marker hit areas.
function renderObjectLabel(placement: ReturnType<typeof selectLabelPlacements>[number], toggleObjectLabel: (object: IConstellationMapObject) => void, labelClassName: string) {
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
                onClick={event => toggleMapObjectLabel(event, object, toggleObjectLabel)}
            >
                {placement.label}
            </text>
        </Tooltip>
    );
}

// Share event handling so labels and markers toggle the same label without starting map gestures.
function toggleMapObjectLabel(event: React.MouseEvent<SVGElement>, object: IConstellationMapObject, toggleObjectLabel: (object: IConstellationMapObject) => void) {
    event.stopPropagation();
    toggleObjectLabel(object);
}

function getObjectTooltip(object: IConstellationMapObject) {
    const sacName = formatMapObjectLabel(object, "sac");
    return object.herschelNo ? `${sacName} / ${object.herschelNo}` : sacName;
}

function isNearViewBox(point: ProjectedPoint, viewBoxWidth: number, height: number) {
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
    viewBoxWidth: number,
    height: number,
    padding: MapPadding,
    dragState: React.MutableRefObject<DragState | null>,
    setPan: (pan: PlanePan) => void) {
    const drag = dragState.current;
    if (drag == null || drag.pointerId !== event.pointerId) {
        return;
    }

    event.preventDefault();
    const scaleData = getProjectionScaleData(viewExtent, viewBoxWidth, height, padding);
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
    viewBoxWidth: number,
    height: number,
    padding: MapPadding,
    setZoom: (zoom: number) => void,
    setPan: (pan: PlanePan) => void) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.14 : 1 / 1.14;
    const nextZoom = clamp(zoom * factor, minZoom, maxZoom);
    const planePoint = svgPointToPlane(event, viewExtent, viewBoxWidth, height, padding);
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

function svgPointToPlane(event: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement> | React.WheelEvent<SVGSVGElement>, extent: MapExtent, viewBoxWidth: number, height: number, padding: MapPadding) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return null;
    }

    const svgX = (event.clientX - rect.left) / rect.width * viewBoxWidth;
    const svgY = (event.clientY - rect.top) / rect.height * height;
    const scaleData = getProjectionScaleData(extent, viewBoxWidth, height, padding);

    return {
        x: extent.minPlaneX + (svgX - scaleData.xOffset) / scaleData.scale,
        y: extent.maxPlaneY - (svgY - scaleData.yOffset) / scaleData.scale,
    };
}

function getProjectionScaleData(extent: MapExtent, viewBoxWidth: number, height: number, padding: MapPadding) {
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

function getMapPadding(viewBoxWidth: number, height: number): MapPadding {
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
