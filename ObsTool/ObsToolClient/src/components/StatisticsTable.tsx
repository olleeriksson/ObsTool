import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import CircularProgress from "@mui/material/CircularProgress";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IStatistics, IObsGroupStatistics, IConstellationStatistics } from "../types/Types";
import Api from "../api/Api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ConstellationDialog from "./ConstellationDialog";

const styles = (theme: Theme) => createStyles({
    root: {
        margin: "auto",
        marginTop: theme.spacing(3),
        minHeight: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowX: "auto",
    },
    statisticsRoot: {
        margin: "auto",
        marginTop: theme.spacing(3),
        overflowX: "auto",
    },
    constellationRoot: {
        margin: "auto",
        marginTop: theme.spacing(2),
        overflowX: "auto",
    },
    table: {
        minWidth: "500",
        padding: "Table"
    },
    statisticsHeaderCell: {
        width: "100%",
    },
    statisticsHeaderLayout: {
        alignItems: "center",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        width: "100%",
    },
    statisticsHeaderSide: {
        minWidth: 0,
    },
    statisticsHeaderTitle: {
        fontWeight: 700,
        justifySelf: "center",
        textAlign: "center",
    },
    statisticsHeaderControls: {
        justifySelf: "end",
        minWidth: 0,
    },
    sessionScopeControl: {
        alignItems: "center",
        display: "inline-flex",
        gap: theme.spacing(0.5),
        justifyContent: "flex-end",
        whiteSpace: "nowrap",
    },
    sessionScopeLabel: {
        color: theme.palette.text.secondary,
        fontWeight: 400,
    },
    sessionScopeButton: {
        padding: theme.spacing(0.25),
    },
    nowComparison: {
        color: theme.palette.primary.main,
        fontWeight: 500,
        whiteSpace: "nowrap",
    },
    mainNowComparisonCell: {
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(1),
    },
    constellationNowComparisonCell: {
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(1),
    },
    collapseToggleCell: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    constellationTable: {
        minWidth: 650,
    },
    progressPrimary: {
        whiteSpace: "nowrap",
    },
    percentText: {
        marginLeft: theme.spacing(1),
    },
    nonDetection: {
        color: theme.palette.text.disabled,
        fontWeight: 400,
    },
    toggleTitle: {
        alignItems: "center",
        cursor: "pointer",
        display: "flex",
        fontWeight: 500,
        justifyContent: "center",
    },
    toggleButton: {
        marginLeft: theme.spacing(0.5),
    },
    expandIcon: {
        transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandIconOpen: {
        transform: "rotate(180deg)",
    },
    catalogSortIndicators: {
        alignItems: "center",
        display: "inline-flex",
        marginRight: theme.spacing(0.25),
    },
    catalogMetricDots: {
        alignItems: "center",
        display: "inline-flex",
        gap: theme.spacing(0.5),
    },
    catalogMetricDot: {
        backgroundColor: theme.palette.text.secondary,
        border: 0,
        borderRadius: "50%",
        cursor: "pointer",
        height: 4,
        padding: 0,
        width: 4,
    },
    catalogMetricDotActive: {
        backgroundColor: theme.palette.text.primary,
        height: 7,
        width: 7,
    },
    catalogSortArrow: {
        fontSize: 18,
        marginRight: theme.spacing(0.75),
        opacity: 0,
        transition: theme.transitions.create(["opacity", "transform"], {
            duration: theme.transitions.duration.shortest,
        }),
    },
    catalogSortArrowActive: {
        opacity: 1,
    },
    catalogSortArrowAsc: {
        transform: "rotate(180deg)",
    },
    catalogSortLabel: {
        alignItems: "center",
        background: "transparent",
        border: 0,
        color: "inherit",
        cursor: "pointer",
        display: "inline-flex",
        font: "inherit",
        justifyContent: "flex-end",
        padding: 0,
        verticalAlign: "middle",
        "&:hover $catalogSortArrow": {
            opacity: 0.5,
        },
        "&:hover $catalogSortArrowActive": {
            opacity: 1,
        },
    },
    constellationRow: {
        cursor: "pointer",
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
        },
    },
});

export interface IStatisticsTableProps extends WithStyles<typeof styles> {
}

export interface IStatisticsTableState {
    isLoading: boolean;
    isError: boolean;
    statistics?: IStatistics;
    isConstellationStatisticsExpanded: boolean;
    constellationSortBy: ConstellationSortColumn;
    constellationSortDirection: "asc" | "desc";
    constellationCatalogSortMetric: CatalogSortMetric;
    selectedConstellation?: IConstellationStatistics;
    isConstellationDialogOpen: boolean;
    statsExcludeLastSessions: number;
    allSessionsStatistics?: IStatistics;
}

type ConstellationSortColumn = "constellation" | "observed" | "h400" | "h2500";
type CatalogSortMetric = "observed" | "total" | "percentage";

class StatisticsTable extends React.Component<IStatisticsTableProps, IStatisticsTableState> {
    constructor(props: IStatisticsTableProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            statistics: undefined,
            isConstellationStatisticsExpanded: false,
            constellationSortBy: "h2500",
            constellationSortDirection: "desc",
            constellationCatalogSortMetric: "observed",
            selectedConstellation: undefined,
            isConstellationDialogOpen: false,
            statsExcludeLastSessions: 0,
            allSessionsStatistics: undefined,
        };
    }

    public componentDidMount() {
        this.loadData();
    }

    private loadData() {
        const { statsExcludeLastSessions } = this.state;
        const statisticsRequest = Api.getStatistics(statsExcludeLastSessions);
        const allSessionsStatisticsRequest = statsExcludeLastSessions > 0
            ? Api.getStatistics(0)
            : Promise.resolve(undefined);

        Promise.all([statisticsRequest, allSessionsStatisticsRequest]).then(
            ([statisticsResponse, allSessionsStatisticsResponse]) => {
                this.setState({
                    allSessionsStatistics: allSessionsStatisticsResponse?.data,
                    isLoading: false,
                    statistics: statisticsResponse.data,
                });
            },
            () => {
                this.setState({
                    allSessionsStatistics: undefined,
                    isError: true,
                    isLoading: false,
                });
            }
        );
    }

    private addRow(id: number, text?: string, value?: React.ReactNode, nowValue?: React.ReactNode, text2?: string, value2?: React.ReactNode, nowValue2?: React.ReactNode) {
        return {
            key: id,
            nowValue: nowValue,
            nowValue2: nowValue2,
            text: text,
            value: value,
            text2: text2,
            value2: value2
        };
    }

    private createRowsData(statistics?: IStatistics) {
        let id = 0;
        const rowsData = [];
        if (statistics) {
            rowsData.push(this.addRow(
                id++,
                "Observation sessions", statistics.numObsSessions.toString(),
                this.renderNumberDelta(statistics.numObsSessions, this.state.allSessionsStatistics?.numObsSessions),
                "Observed Galaxies", statistics.numObservedGalaxies.toString(),
                this.renderNumberDelta(statistics.numObservedGalaxies, this.state.allSessionsStatistics?.numObservedGalaxies)));
            rowsData.push(this.addRow(
                id++,
                "Recorded observations", statistics.numObservations.toString(),
                this.renderNumberDelta(statistics.numObservations, this.state.allSessionsStatistics?.numObservations),
                "Observed Bright Nebulae", statistics.numObservedBrightNebulae.toString(),
                this.renderNumberDelta(statistics.numObservedBrightNebulae, this.state.allSessionsStatistics?.numObservedBrightNebulae)));
            rowsData.push(this.addRow(
                id++,
                "Observed objects", statistics.numObservedObjects.toString(),
                this.renderNumberDelta(statistics.numObservedObjects, this.state.allSessionsStatistics?.numObservedObjects),
                "Observed Open Clusters", statistics.numObservedOpenClusters.toString(),
                this.renderNumberDelta(statistics.numObservedOpenClusters, this.state.allSessionsStatistics?.numObservedOpenClusters)));
            rowsData.push(this.addRow(
                id++,
                "Detections (non-detections)", this.renderObservationNonDetectionCount(statistics.numDetections, statistics.numNonDetections),
                this.renderObservationNonDetectionDelta(statistics.numDetections, statistics.numNonDetections, this.state.allSessionsStatistics?.numDetections, this.state.allSessionsStatistics?.numNonDetections),
                "Observed Planetary Nebulae", statistics.numObservedPlanetaryNebulae.toString(),
                this.renderNumberDelta(statistics.numObservedPlanetaryNebulae, this.state.allSessionsStatistics?.numObservedPlanetaryNebulae)));
            rowsData.push(this.addRow(
                id++,
                "Recorded sketches", statistics.numSketches.toString(),
                this.renderNumberDelta(statistics.numSketches, this.state.allSessionsStatistics?.numSketches),
                "Observed Globular Clusters", statistics.numObservedGlobularClusters.toString(),
                this.renderNumberDelta(statistics.numObservedGlobularClusters, this.state.allSessionsStatistics?.numObservedGlobularClusters)));
            rowsData.push(this.addRow(
                id++,
                "Used locations", statistics.numLocations.toString(),
                this.renderNumberDelta(statistics.numLocations, this.state.allSessionsStatistics?.numLocations),
                "Observed Dark Nebulae", statistics.numObservedDarkNebulae.toString(),
                this.renderNumberDelta(statistics.numObservedDarkNebulae, this.state.allSessionsStatistics?.numObservedDarkNebulae)));
            rowsData.push(this.addRow(
                id++,
                "Observed Messier objects", this.renderCountWithTotal(statistics.numObservedMessierObjects, 110),
                this.renderCountWithTotalDelta(statistics.numObservedMessierObjects, 110, this.state.allSessionsStatistics?.numObservedMessierObjects),
                "Observed NGC objects", statistics.numObservedNGCObjects.toString(),
                this.renderNumberDelta(statistics.numObservedNGCObjects, this.state.allSessionsStatistics?.numObservedNGCObjects)));
            if (statistics.h2500 && statistics.h400) {
                rowsData.push(this.addRow(
                    id++,
                    "Observed H2500 objects", this.renderCatalogProgress(statistics.h2500, false),
                    this.renderCatalogProgressDelta(statistics.h2500, this.state.allSessionsStatistics?.h2500, false),
                    "Observed H400 objects", this.renderCatalogProgress(statistics.h400, false),
                    this.renderCatalogProgressDelta(statistics.h400, this.state.allSessionsStatistics?.h400, false)));
                rowsData.push(this.addRow(
                    id++,
                    "Tried & failed H2500 objects", statistics.h2500.nonDetections.toString(),
                    this.renderNumberDelta(statistics.h2500.nonDetections, this.state.allSessionsStatistics?.h2500?.nonDetections),
                    "Tried & failed H400 objects", statistics.h400.nonDetections.toString(),
                    this.renderNumberDelta(statistics.h400.nonDetections, this.state.allSessionsStatistics?.h400?.nonDetections)));
            }
        }
        return rowsData;
    }

    private renderObservationNonDetectionCount(observed: number, nonDetections: number) {
        return (
            <span className={this.props.classes.progressPrimary}>
                {observed}{this.renderNonDetections(nonDetections)}
            </span>
        );
    }

    // Renders the all-sessions delta for the detection/non-detection paired statistic.
    private renderObservationNonDetectionDelta(observed: number, nonDetections: number, allObserved?: number, allNonDetections?: number) {
        if (allObserved === undefined || allNonDetections === undefined) {
            return null;
        }

        return (
            <span className={this.props.classes.nowComparison}>
                {this.formatSignedDelta(allObserved - observed)}
                <span> ({this.formatSignedDelta(allNonDetections - nonDetections)})</span>
            </span>
        );
    }

    private renderCountWithTotal(count: number, total: number) {
        return (
            <span className={this.props.classes.progressPrimary}>
                {count} / {total}
                <span className={this.props.classes.percentText}>({this.formatPercent(count, total)})</span>
            </span>
        );
    }

    // Renders a delta for count/total cells without repeating the unchanged total.
    private renderCountWithTotalDelta(count: number, total: number, allCount?: number) {
        if (allCount === undefined) {
            return null;
        }

        return this.renderNowComparison(
            this.formatSignedDelta(allCount - count),
            this.formatSignedPercentDelta(this.getRoundedPercent(allCount, total) - this.getRoundedPercent(count, total)));
    }

    // Renders catalog progress, optionally keeping failed attempts inline for compact table contexts.
    private renderCatalogProgress(stats: IObsGroupStatistics, includeNonDetections = true) {
        return (
            <span className={this.props.classes.progressPrimary}>
                {stats.observed}{includeNonDetections && this.renderNonDetections(stats.nonDetections)} / {stats.total}
                <span className={this.props.classes.percentText}>({this.formatPercent(stats.observed, stats.total)})</span>
            </span>
        );
    }

    // Renders a delta for catalog progress cells without repeating the unchanged catalog total.
    private renderCatalogProgressDelta(stats: IObsGroupStatistics, allStats?: IObsGroupStatistics, includeNonDetections = true) {
        if (!allStats) {
            return null;
        }

        const nonDetectionDelta = includeNonDetections
            ? ` (${this.formatSignedDelta(allStats.nonDetections - stats.nonDetections)})`
            : "";

        return this.renderNowComparison(
            `${this.formatSignedDelta(allStats.observed - stats.observed)}${nonDetectionDelta}`,
            this.formatSignedPercentDelta(this.getRoundedPercent(allStats.observed, allStats.total) - this.getRoundedPercent(stats.observed, stats.total)));
    }

    // Renders a blue signed delta for simple number-only cells.
    private renderNumberDelta(value: number, allValue?: number) {
        if (allValue === undefined) {
            return null;
        }

        return <span className={this.props.classes.nowComparison}>{this.formatSignedDelta(allValue - value)}</span>;
    }

    // Renders the shared blue comparison text for count plus percentage deltas.
    private renderNowComparison(countDelta: string, percentDelta: string) {
        return (
            <span className={this.props.classes.nowComparison}>
                {countDelta}
                <span className={this.props.classes.percentText}>({percentDelta})</span>
            </span>
        );
    }

    private renderNonDetections(nonDetections: number) {
        if (nonDetections <= 0) {
            return null;
        }

        return <span className={this.props.classes.nonDetection}> (+{nonDetections})</span>;
    }

    private getRoundedPercent(count: number, total: number) {
        return total === 0 ? 0 : Math.round(count / total * 100);
    }

    private formatPercent(count: number, total: number) {
        return `${this.getRoundedPercent(count, total)}%`;
    }

    private formatSignedDelta(delta: number) {
        return delta > 0 ? `+${delta}` : delta.toString();
    }

    private formatSignedPercentDelta(delta: number) {
        return `${this.formatSignedDelta(delta)}%`;
    }

    private updateConstellationSort(column: ConstellationSortColumn) {
        if (this.isCatalogSortColumn(column)) {
            const nextCatalogSort = this.state.constellationSortBy === column
                ? this.getNextCatalogSort()
                : { metric: "observed" as CatalogSortMetric, direction: "desc" as const };

            this.setState({
                constellationSortBy: column,
                // Catalog columns cycle through observed, total, and percentage in both directions.
                constellationSortDirection: nextCatalogSort.direction,
                constellationCatalogSortMetric: nextCatalogSort.metric,
            });
            return;
        }

        this.setState({
            constellationSortBy: column,
            constellationSortDirection:
                this.state.constellationSortBy === column && this.state.constellationSortDirection === "desc"
                    ? "asc"
                    : "desc",
        });
    }

    private isCatalogSortColumn(column: ConstellationSortColumn) {
        return column === "h400" || column === "h2500";
    }

    private getNextSortDirection(column: ConstellationSortColumn) {
        if (this.isCatalogSortColumn(column)) {
            return this.state.constellationSortBy === column
                ? this.getNextCatalogSort().direction
                : "desc";
        }

        return this.state.constellationSortBy === column && this.state.constellationSortDirection === "desc"
            ? "asc"
            : "desc";
    }

    private getCatalogSortCycle() {
        return [
            { metric: "observed" as CatalogSortMetric, direction: "desc" as const },
            { metric: "total" as CatalogSortMetric, direction: "desc" as const },
            { metric: "percentage" as CatalogSortMetric, direction: "desc" as const },
            { metric: "observed" as CatalogSortMetric, direction: "asc" as const },
            { metric: "total" as CatalogSortMetric, direction: "asc" as const },
            { metric: "percentage" as CatalogSortMetric, direction: "asc" as const },
        ];
    }

    private getNextCatalogSort() {
        const cycle = this.getCatalogSortCycle();
        const currentIndex = cycle.findIndex(item =>
            item.metric === this.state.constellationCatalogSortMetric &&
            item.direction === this.state.constellationSortDirection);

        return cycle[(currentIndex + 1) % cycle.length];
    }

    private updateCatalogMetricSort(event: React.MouseEvent, column: ConstellationSortColumn, metric: CatalogSortMetric) {
        event.stopPropagation();
        this.setState({
            constellationSortBy: column,
            constellationSortDirection: this.state.constellationSortBy === column ? this.state.constellationSortDirection : "desc",
            constellationCatalogSortMetric: metric,
        });
    }

    private getCatalogSortValue(stats: IObsGroupStatistics) {
        switch (this.state.constellationCatalogSortMetric) {
            case "observed":
                return stats.observed;
            case "total":
                return stats.total;
            case "percentage":
                return stats.total === 0 ? 0 : stats.observed / stats.total;
        }
    }

    private sortConstellationStats(stats: IConstellationStatistics[]) {
        const { constellationSortBy, constellationSortDirection } = this.state;
        const direction = constellationSortDirection === "asc" ? 1 : -1;

        return [...stats].sort((a, b) => {
            let result = 0;
            switch (constellationSortBy) {
                case "constellation":
                    result = a.constellation.localeCompare(b.constellation);
                    break;
                case "observed":
                    result = a.observed - b.observed;
                    break;
                case "h400":
                    result = this.getCatalogSortValue(a.h400) - this.getCatalogSortValue(b.h400);
                    break;
                case "h2500":
                    result = this.getCatalogSortValue(a.h2500) - this.getCatalogSortValue(b.h2500);
                    break;
            }

            if (result === 0) {
                result = a.constellation.localeCompare(b.constellation);
            }
            return result * direction;
        });
    }

    private renderSortableHeader(label: string, column: ConstellationSortColumn, align: "left" | "right" = "left") {
        const direction = this.state.constellationSortBy === column
            ? this.state.constellationSortDirection
            : this.getNextSortDirection(column);

        if (this.isCatalogSortColumn(column)) {
            return this.renderCatalogSortableHeader(label, column, align, direction);
        }

        return (
            <TableCell size="small" align={align} sortDirection={this.state.constellationSortBy === column ? this.state.constellationSortDirection : false}>
                <TableSortLabel
                    active={this.state.constellationSortBy === column}
                    direction={direction}
                    onClick={() => this.updateConstellationSort(column)}
                >
                    {label}
                </TableSortLabel>
            </TableCell>
        );
    }

    private renderCatalogSortableHeader(label: string, column: ConstellationSortColumn, align: "left" | "right", direction: "asc" | "desc") {
        const isActive = this.state.constellationSortBy === column;
        const arrowClassName = [
            this.props.classes.catalogSortArrow,
            isActive ? this.props.classes.catalogSortArrowActive : "",
            direction === "asc" ? this.props.classes.catalogSortArrowAsc : "",
        ].join(" ");

        return (
            <TableCell size="small" align={align} sortDirection={isActive ? this.state.constellationSortDirection : false}>
                <span
                    className={this.props.classes.catalogSortLabel}
                    onClick={() => this.updateConstellationSort(column)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            this.updateConstellationSort(column);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {this.renderCatalogSortIndicators(column)}
                    <ArrowDownwardIcon className={arrowClassName} />
                    <span>{label}</span>
                </span>
            </TableCell>
        );
    }

    private renderCatalogSortIndicators(column: ConstellationSortColumn) {
        if (this.state.constellationSortBy !== column) {
            return null;
        }

        return (
            <span className={this.props.classes.catalogSortIndicators}>
                {this.renderCatalogSortDotIndicator(column)}
            </span>
        );
    }

    private renderCatalogSortDotIndicator(column: ConstellationSortColumn) {
        return (
            <span className={this.props.classes.catalogMetricDots}>
                {this.renderCatalogMetricDot(column, "observed")}
                {this.renderCatalogMetricDot(column, "total")}
                {this.renderCatalogMetricDot(column, "percentage")}
            </span>
        );
    }

    private renderCatalogMetricDot(column: ConstellationSortColumn, metric: CatalogSortMetric) {
        const isActive = this.state.constellationSortBy === column && this.state.constellationCatalogSortMetric === metric;
        return (
            <button
                type="button"
                className={`${this.props.classes.catalogMetricDot} ${isActive ? this.props.classes.catalogMetricDotActive : ""}`}
                onClick={(event) => this.updateCatalogMetricSort(event, column, metric)}
                aria-label={`Sort ${column.toUpperCase()} by ${metric}`}
            />
        );
    }

    private renderConstellationTable(stats: IConstellationStatistics[]) {
        const { classes } = this.props;
        const sortedStats = this.sortConstellationStats(stats);
        const allConstellations = this.getAllSessionsConstellationsByAbbreviation();
        const showNowComparison = this.shouldShowNowComparison();
        return (
            <Table className={classes.constellationTable} size="small">
                <TableHead>
                    <TableRow>
                        {this.renderSortableHeader("Constellation", "constellation")}
                        {this.renderSortableHeader("Observed", "observed", "right")}
                        {showNowComparison && <TableCell className={`${classes.nowComparison} ${classes.constellationNowComparisonCell}`} size="small" align="right">(now)</TableCell>}
                        {this.renderSortableHeader("H400", "h400", "right")}
                        {showNowComparison && <TableCell className={`${classes.nowComparison} ${classes.constellationNowComparisonCell}`} size="small" align="right">(now)</TableCell>}
                        {this.renderSortableHeader("H2500", "h2500", "right")}
                        {showNowComparison && <TableCell className={`${classes.nowComparison} ${classes.constellationNowComparisonCell}`} size="small" align="right">(now)</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedStats.map(row => {
                        const allConstellation = allConstellations.get(row.constellationAbbrv);
                        return (
                            <TableRow
                                key={row.constellation}
                                className={classes.constellationRow}
                                hover={true}
                                tabIndex={0}
                                onClick={() => this.openConstellationDialog(row)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        this.openConstellationDialog(row);
                                    }
                                }}
                            >
                                <TableCell size="small" component="th" scope="row">{row.constellation}</TableCell>
                                <TableCell size="small" align="right">{row.observed}</TableCell>
                                {showNowComparison && <TableCell className={classes.constellationNowComparisonCell} size="small" align="right">{this.renderNumberDelta(row.observed, allConstellation?.observed)}</TableCell>}
                                <TableCell size="small" align="right">{this.renderCatalogProgress(row.h400)}</TableCell>
                                {showNowComparison && <TableCell className={classes.constellationNowComparisonCell} size="small" align="right">{this.renderCatalogProgressDelta(row.h400, allConstellation?.h400)}</TableCell>}
                                <TableCell size="small" align="right">{this.renderCatalogProgress(row.h2500)}</TableCell>
                                {showNowComparison && <TableCell className={classes.constellationNowComparisonCell} size="small" align="right">{this.renderCatalogProgressDelta(row.h2500, allConstellation?.h2500)}</TableCell>}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    // Indexes the all-session constellation statistics so scoped rows can render adjacent deltas.
    private getAllSessionsConstellationsByAbbreviation() {
        return new Map((this.state.allSessionsStatistics?.constellations || [])
            .map(constellation => [constellation.constellationAbbrv, constellation]));
    }

    // Applies the session-scope stepper value and reloads both statistics tables from the API.
    private updateStatsExcludeLastSessions(delta: number) {
        const nextStatsExcludeLastSessions = Math.max(0, this.state.statsExcludeLastSessions + delta);
        if (nextStatsExcludeLastSessions === this.state.statsExcludeLastSessions) {
            return;
        }

        this.setState({
            allSessionsStatistics: undefined,
            isError: false,
            isLoading: true,
            statsExcludeLastSessions: nextStatsExcludeLastSessions,
        }, () => this.loadData());
    }

    // Builds the compact header label for the current session-scope filter.
    private getStatsSessionScopeLabel() {
        const { statsExcludeLastSessions } = this.state;
        if (statsExcludeLastSessions === 0) {
            return "All sessions";
        }

        return statsExcludeLastSessions === 1
            ? "All but last 1 session"
            : `All but last ${statsExcludeLastSessions} sessions`;
    }

    // Renders the header control as "label < >" while keeping the all-sessions decrement button disabled.
    private renderStatsSessionScopeControl() {
        const { classes } = this.props;
        const isAtAllSessions = this.state.statsExcludeLastSessions === 0;

        return (
            <span className={classes.sessionScopeControl}>
                <span className={classes.sessionScopeLabel}>{this.getStatsSessionScopeLabel()}</span>
                <IconButton
                    className={classes.sessionScopeButton}
                    aria-label="Exclude one more recent session"
                    onClick={() => this.updateStatsExcludeLastSessions(1)}
                    size="small"
                >
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                    className={classes.sessionScopeButton}
                    aria-label="Include one more recent session"
                    disabled={isAtAllSessions}
                    onClick={() => this.updateStatsExcludeLastSessions(-1)}
                    size="small"
                >
                    <ChevronRightIcon fontSize="small" />
                </IconButton>
            </span>
        );
    }

    private shouldShowNowComparison() {
        return this.state.statsExcludeLastSessions > 0 && !!this.state.allSessionsStatistics;
    }

    private openConstellationDialog(constellation: IConstellationStatistics) {
        this.setState({
            selectedConstellation: constellation,
            isConstellationDialogOpen: true,
        });
    }

    private closeConstellationDialog() {
        this.setState({
            isConstellationDialogOpen: false,
        });
    }

    private renderConstellationStatisticsRows() {
        const { classes } = this.props;
        const constellations = this.state.statistics?.constellations || [];
        if (constellations.length === 0) {
            return null;
        }

        return (
            <Paper className={classes.constellationRoot}>
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow>
                            <TableCell className={classes.collapseToggleCell} size="small" colSpan={4}>
                                <div
                                    className={classes.toggleTitle}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => this.setState({ isConstellationStatisticsExpanded: !this.state.isConstellationStatisticsExpanded })}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            this.setState({ isConstellationStatisticsExpanded: !this.state.isConstellationStatisticsExpanded });
                                        }
                                    }}
                                >
                                    <span>Statistics by constellation</span>
                                    <IconButton
                                        className={classes.toggleButton}
                                        aria-label="Toggle constellation progress"
                                        size="small"
                                    >
                                        <ExpandMoreIcon
                                            className={`${classes.expandIcon} ${this.state.isConstellationStatisticsExpanded ? classes.expandIconOpen : ""}`}
                                        />
                                    </IconButton>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell size="small" colSpan={4} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                <Collapse in={this.state.isConstellationStatisticsExpanded} timeout="auto" unmountOnExit={true}>
                                    {this.renderConstellationTable(constellations)}
                                </Collapse>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        );
    }

    public render() {
        const { classes } = this.props;
        const showNowComparison = this.shouldShowNowComparison();

        const rowsData = this.state.isLoading ? [] : this.createRowsData(this.state.statistics);
        const tableRows = rowsData.map(row => {
            return (
                <TableRow key={row.key}>
                    <TableCell size="small" component="th" scope="row">{row.text}</TableCell>
                    <TableCell size="small" align="right">{row.value}</TableCell>
                    {showNowComparison && <TableCell className={classes.mainNowComparisonCell} size="small" align="right">{row.nowValue}</TableCell>}
                    <TableCell size="small" component="th" scope="row">{row.text2}</TableCell>
                    <TableCell size="small" align="right">{row.value2}</TableCell>
                    {showNowComparison && <TableCell className={classes.mainNowComparisonCell} size="small" align="right">{row.nowValue2}</TableCell>}
                </TableRow>
            );
        });

        if (this.state.isLoading) {
            return (
                <Paper className={classes.root}>
                    <CircularProgress className="faSpaceAfter" /> Loading...
                </Paper>
            );
        } else if (this.state.isError) {
            return (
                <Paper className={classes.root}>
                    <Typography component="div" variant="subtitle1" align="center" color="error">
                        <strong>
                            <FontAwesomeIcon icon="exclamation-triangle" style={{ color: "red" }} className="faSpaceAfter" />
                            Server is not responding!
                        </strong>
                    </Typography>
                </Paper>
            );
        } else {
            return (
                <>
                    <Paper className={classes.statisticsRoot}>
                        <Table className={classes.table} >
                            <TableHead>
                                <TableRow>
                                    <TableCell className={classes.statisticsHeaderCell} size="small" colSpan={showNowComparison ? 6 : 4}>
                                        <div className={classes.statisticsHeaderLayout}>
                                            <span className={classes.statisticsHeaderSide} />
                                            <span className={classes.statisticsHeaderTitle}>Statistics</span>
                                            <span className={classes.statisticsHeaderControls}>
                                                {this.renderStatsSessionScopeControl()}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableRows}
                            </TableBody>
                        </Table>
                    </Paper>
                    {this.renderConstellationStatisticsRows()}
                    <ConstellationDialog
                        open={this.state.isConstellationDialogOpen}
                        constellation={this.state.selectedConstellation}
                        onClose={() => this.closeConstellationDialog()}
                    />
                </>
            );
        }
    }
}

export default withStyles(styles)(StatisticsTable);
