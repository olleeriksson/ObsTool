import * as React from "react";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { Theme } from "@mui/material/styles";
import { connect } from "react-redux";
import Api from "src/api/Api";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IAppState, IDataState, IPagedSystemEventList, ISystemEventFilters } from "src/types/Types";

const pageSizeOptions = [25, 50, 100];

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(4)
    },
    panel: {
        padding: theme.spacing(3)
    },
    toolbar: {
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        justifyContent: "space-between",
        marginBottom: theme.spacing(2)
    },
    titleGroup: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(1)
    },
    pageSizeField: {
        width: 120
    },
    controlGroup: {
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(1)
    },
    searchField: {
        width: 260
    },
    tableContainer: {
        marginTop: theme.spacing(2)
    },
    columnHeader: {
        alignItems: "center",
        display: "inline-flex",
        flexWrap: "wrap",
        gap: theme.spacing(0.5)
    },
    activeFilterChip: {
        maxWidth: 160
    },
    expandCell: {
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        width: 42
    },
    expandButton: {
        padding: theme.spacing(0.5)
    },
    singleLineCell: {
        maxWidth: 260,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    expandedCell: {
        maxWidth: 420,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
    },
    compactCell: {
        whiteSpace: "nowrap"
    },
    topAlignedCell: {
        verticalAlign: "top"
    },
    filterableValue: {
        alignItems: "center",
        display: "inline-flex",
        gap: theme.spacing(0.25),
        maxWidth: "100%"
    },
    filterableText: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    filterButton: {
        flex: "0 0 auto",
        color: theme.palette.action.disabledBackground,
        height: 20,
        marginLeft: theme.spacing(0.25),
        padding: 0,
        width: 20,
        "& svg": {
            fontSize: 16
        },
        "&:hover": {
            color: theme.palette.action.disabledBackground
        }
    },
    eventKey: {
        fontFamily: "monospace"
    },
    muted: {
        color: theme.palette.text.secondary
    },
    error: {
        color: theme.palette.error.main,
        marginTop: theme.spacing(2)
    },
    pagination: {
        display: "flex",
        justifyContent: "center",
        marginTop: theme.spacing(2)
    }
});

interface ISystemEventLogPageProps extends WithStyles<typeof styles> {
    store: IDataState;
}

type SystemEventColumnFilterKey = "date" | "userId" | "eventName" | "eventKey";
type SystemEventFilterValue = string | number;

interface ISystemEventColumnFilters {
    date?: string;
    userId?: number;
    eventName?: string;
    eventKey?: string;
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "System event log request failed.";
}

// Formats UTC timestamps with stable sortable date and 24-hour time parts.
function formatDateParts(value?: string) {
    if (!value) {
        return { date: "", time: "" };
    }

    const date = new Date(value);
    const pad = (part: number) => part.toString().padStart(2, "0");

    return {
        date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
        time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    };
}

// Keeps secondary timestamps compact where date/time are not separate table columns.
function formatDateTime(value?: string) {
    const parts = formatDateParts(value);

    return parts.date && parts.time
        ? `${parts.date} ${parts.time}`
        : "";
}

function SystemEventLogPage(props: ISystemEventLogPageProps) {
    const { classes } = props;
    const [events, setEvents] = React.useState<IPagedSystemEventList | undefined>();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();
    const [expandedEventIds, setExpandedEventIds] = React.useState<Set<number>>(new Set<number>());
    const [searchText, setSearchText] = React.useState("");
    const [search, setSearch] = React.useState("");
    const [columnFilters, setColumnFilters] = React.useState<ISystemEventColumnFilters>({});

    const systemEventFilters = React.useMemo<ISystemEventFilters>(() => ({
        search: search || undefined,
        date: columnFilters.date,
        userId: columnFilters.userId,
        eventName: columnFilters.eventName,
        eventKey: columnFilters.eventKey
    }), [search, columnFilters]);

    const loadEvents = React.useCallback(() => {
        if (!props.store.canManageUsers) {
            return;
        }

        setIsLoading(true);
        setError(undefined);

        Api.getSystemEvents(page, pageSize, systemEventFilters).then(
            response => {
                setEvents(response.data);
                setIsLoading(false);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    }, [page, pageSize, props.store.canManageUsers, systemEventFilters]);

    React.useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setPage(1);
            setSearch(searchText.trim());
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [searchText]);

    // Keeps the visible page in sync with the MUI paginator.
    const handlePageChange = (_event: React.ChangeEvent<unknown>, nextPage: number) => {
        setPage(nextPage);
    };

    // Resets to the first page when the admin changes server-side page size.
    const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(1);
        setPageSize(Number(event.target.value));
    };

    // Updates the debounced broad search input used by the backend event-log query.
    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
    };

    // Clears the broad search immediately without waiting for the debounce timer.
    const handleClearSearch = () => {
        setPage(1);
        setSearchText("");
        setSearch("");
    };

    // Replaces a single column filter while preserving the other active column filters.
    const handleSetColumnFilter = (filterKey: SystemEventColumnFilterKey, value: SystemEventFilterValue) => {
        setPage(1);
        setColumnFilters(previousFilters => ({
            ...previousFilters,
            [filterKey]: value
        }));
    };

    // Removes one column filter without disturbing the other active filters.
    const handleClearColumnFilter = (filterKey: SystemEventColumnFilterKey) => {
        setPage(1);
        setColumnFilters(previousFilters => {
            const nextFilters = { ...previousFilters };
            delete nextFilters[filterKey];

            return nextFilters;
        });
    };

    // Tracks expanded rows by event id so pagination reloads do not depend on object identity.
    const handleToggleExpanded = (eventId: number) => {
        setExpandedEventIds(previousIds => {
            const nextIds = new Set<number>(previousIds);

            if (nextIds.has(eventId)) {
                nextIds.delete(eventId);
            } else {
                nextIds.add(eventId);
            }

            return nextIds;
        });
    };

    // Renders a table header label with its active exact-match filter and individual clear control.
    const renderColumnHeader = (label: string, filterKey?: SystemEventColumnFilterKey) => {
        const filterValue = filterKey ? columnFilters[filterKey] : undefined;

        return (
            <span className={classes.columnHeader}>
                <span>{label}</span>
                {filterKey && filterValue !== undefined && (
                    <Chip
                        className={classes.activeFilterChip}
                        size="small"
                        label={filterValue.toString()}
                        onDelete={() => handleClearColumnFilter(filterKey)}
                    />
                )}
            </span>
        );
    };

    // Renders a cell value with the small exact-filter button immediately after the visible content.
    const renderFilterableCell = (
        displayValue: string,
        filterKey: SystemEventColumnFilterKey,
        filterValue: SystemEventFilterValue | undefined,
        className: string) => (
            <TableCell className={className}>
                <span className={classes.filterableValue}>
                    <span className={classes.filterableText}>{displayValue}</span>
                    {displayValue && filterValue !== undefined && (
                        <Tooltip title={`Filter by ${displayValue}`}>
                            <IconButton
                                className={classes.filterButton}
                                size="small"
                                aria-label={`Filter by ${displayValue}`}
                                onClick={() => handleSetColumnFilter(filterKey, filterValue)}
                            >
                                <FilterAltIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </span>
            </TableCell>
        );

    if (!props.store.canManageUsers) {
        return (
            <div className={classes.root}>
                <Paper className={classes.panel}>
                    <Typography variant="h5">System Event Log</Typography>
                    <Typography className={classes.muted}>Only superadmins and user 1 can use this page.</Typography>
                </Paper>
            </div>
        );
    }

    const total = events?.total ?? 0;
    const pageCount = Math.max(Math.ceil(total / pageSize), 1);

    return (
        <div className={classes.root}>
            <Paper className={classes.panel}>
                <div className={classes.toolbar}>
                    <div className={classes.titleGroup}>
                        <Typography variant="h5">System Event Log</Typography>
                        {isLoading && <CircularProgress size={20} />}
                    </div>
                    <div className={classes.controlGroup}>
                        <TextField
                            label="Search"
                            size="small"
                            className={classes.searchField}
                            value={searchText}
                            onChange={handleSearchTextChange}
                            InputProps={{
                                endAdornment: searchText ? (
                                    <InputAdornment position="end">
                                        <Tooltip title="Clear search">
                                            <IconButton
                                                size="small"
                                                aria-label="Clear system event search"
                                                onClick={handleClearSearch}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ) : undefined
                            }}
                        />
                        <TextField
                            select
                            label="Page size"
                            size="small"
                            className={classes.pageSizeField}
                            value={pageSize}
                            onChange={handlePageSizeChange}
                        >
                            {pageSizeOptions.map(option => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                </div>

                <Typography className={classes.muted}>{total} events</Typography>

                <TableContainer className={classes.tableContainer}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{renderColumnHeader("Date", "date")}</TableCell>
                                <TableCell>{renderColumnHeader("Time")}</TableCell>
                                <TableCell>{renderColumnHeader("User id", "userId")}</TableCell>
                                <TableCell>Full name</TableCell>
                                <TableCell>{renderColumnHeader("Event", "eventName")}</TableCell>
                                <TableCell>{renderColumnHeader("Key", "eventKey")}</TableCell>
                                <TableCell>Details</TableCell>
                                <TableCell>Admin notification</TableCell>
                                <TableCell className={classes.expandCell}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(events?.data ?? []).map(systemEvent => {
                                const occurred = formatDateParts(systemEvent.occurredUtc);
                                const adminNotification = systemEvent.adminNotificationSentUtc
                                    ? formatDateTime(systemEvent.adminNotificationSentUtc)
                                    : systemEvent.adminNotificationError || "";
                                const isExpanded = expandedEventIds.has(systemEvent.id);
                                const textCellClassName = isExpanded
                                    ? classes.expandedCell
                                    : classes.singleLineCell;
                                const topAlignedCellClassName = isExpanded
                                    ? classes.topAlignedCell
                                    : "";
                                const compactCellClassName = `${classes.compactCell} ${topAlignedCellClassName}`;
                                const textTableCellClassName = `${textCellClassName} ${topAlignedCellClassName}`;

                                return (
                                    <TableRow key={systemEvent.id}>
                                        {renderFilterableCell(occurred.date, "date", occurred.date, compactCellClassName)}
                                        <TableCell className={compactCellClassName}>{occurred.time}</TableCell>
                                        {renderFilterableCell(systemEvent.userId?.toString() ?? "", "userId", systemEvent.userId, compactCellClassName)}
                                        <TableCell className={textTableCellClassName}>{systemEvent.fullName}</TableCell>
                                        {renderFilterableCell(systemEvent.eventName, "eventName", systemEvent.eventName, textTableCellClassName)}
                                        {renderFilterableCell(systemEvent.eventKey, "eventKey", systemEvent.eventKey, `${classes.eventKey} ${textTableCellClassName}`)}
                                        <TableCell className={textTableCellClassName}>{systemEvent.details}</TableCell>
                                        <TableCell className={textTableCellClassName}>{adminNotification}</TableCell>
                                        <TableCell className={`${classes.expandCell} ${topAlignedCellClassName}`}>
                                            <Tooltip title={isExpanded ? "Collapse row" : "Expand row"}>
                                                <IconButton
                                                    className={classes.expandButton}
                                                    size="small"
                                                    aria-label={isExpanded ? "Collapse system event row" : "Expand system event row"}
                                                    onClick={() => handleToggleExpanded(systemEvent.id)}
                                                >
                                                    <KeyboardArrowDownIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {events && events.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9}>No system events.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <div className={classes.pagination}>
                    <Pagination
                        page={Math.min(page, pageCount)}
                        count={pageCount}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </div>

                {error && <Typography className={classes.error}>{error}</Typography>}
            </Paper>
        </div>
    );
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

export default connect(mapStateToProps)(withStyles(styles)(SystemEventLogPage));
