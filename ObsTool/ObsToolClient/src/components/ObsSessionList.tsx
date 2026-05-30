import * as React from "react";
import ObsSessionCard from "./ObsSessionCard";
import { IObsSession } from "../types/Types";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import TimelineIcon from "@mui/icons-material/Timeline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import classNames from "classnames";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";

const styles = (theme: Theme) => createStyles({
  controls: {
    marginBottom: theme.spacing(1.5),
  },
  controlsRow: {
    alignItems: "center",
    display: "grid",
    gap: theme.spacing(1),
    gridTemplateColumns: "minmax(0, 1fr) 88px",
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  searchField: {
    backgroundColor: theme.palette.background.paper,
  },
  pageSizeField: {
    backgroundColor: theme.palette.background.paper,
  },
  resultMeta: {
    alignItems: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  resultMetaLeft: {
    alignItems: "center",
    display: "inline-flex",
    gap: theme.spacing(1),
  },
  clearFilterButton: {
    minWidth: 0,
    padding: theme.spacing(0.25, 0.75),
    textTransform: "none",
  },
  paginator: {
    display: "flex",
    justifyContent: "center",
    margin: theme.spacing(1, 0),
  },
  timelinePanel: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1),
  },
  timelineHeader: {
    alignItems: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    gap: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
  },
  timelineHeaderClear: {
    marginLeft: "auto",
  },
  timelineRange: {
    alignItems: "center",
    display: "inline-flex",
    gap: theme.spacing(0.4),
    marginLeft: theme.spacing(0.25),
    verticalAlign: "middle",
  },
  timelineRangeEndpoint: {
    backgroundColor: theme.palette.action.hover,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    fontWeight: 700,
    lineHeight: 1.3,
    padding: theme.spacing(0.1, 0.45),
  },
  timelineRangeSeparator: {
    color: theme.palette.text.secondary,
  },
  timelineWindow: {
    alignItems: "stretch",
    display: "grid",
    gap: theme.spacing(0.75),
    gridTemplateColumns: "34px minmax(0, 1fr) 34px",
  },
  timelineNavButton: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    height: "100%",
    minHeight: 66,
    padding: 0,
    width: 34,
  },
  timelineBars: {
    alignItems: "end",
    display: "grid",
    gap: 3,
    gridAutoColumns: "minmax(12px, 1fr)",
    gridAutoFlow: "column",
    minHeight: 58,
    overflowX: "auto",
    paddingTop: theme.spacing(0.5),
  },
  timelineBucket: {
    alignItems: "center",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 4,
    color: "inherit",
    cursor: "pointer",
    display: "grid",
    font: "inherit",
    gap: 4,
    gridTemplateRows: "48px auto",
    justifyItems: "center",
    minWidth: 12,
    padding: theme.spacing(0.25),
    "&:disabled": {
      cursor: "default",
      opacity: 0.55,
    },
    "&:focus-visible": {
      borderColor: theme.palette.primary.main,
      outline: "none",
    },
  },
  timelineBucketActive: {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.main,
  },
  timelineBarTrack: {
    alignItems: "end",
    backgroundColor: theme.palette.action.hover,
    borderRadius: 3,
    display: "flex",
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  timelineBar: {
    backgroundColor: theme.palette.primary.main,
    borderRadius: "3px 3px 0 0",
    minHeight: 3,
    width: "100%",
  },
  timelineLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.62rem",
    lineHeight: 1,
  },
});

export interface IObsSessionListProps extends WithStyles<typeof styles> {
  obsSessions: ReadonlyArray<IObsSession>;
  selectedObsSessionId?: number;
  onSelectObsSession: (obsSessionId: number) => void;
}

export interface IObsSessionListState {
  currentPage: number;
  pageSize: number;
  searchText: string;
  timelineWindowStartDate?: string;
  selectedTimelineMonthKey?: string;
}

interface ITimelineBucket {
  key: string;
  label: string;
  count: number;
}

class ObsSessionList extends React.Component<IObsSessionListProps, IObsSessionListState> {
  private static DEFAULT_PAGE_SIZE = 6;
  private static PAGE_SIZE_OPTIONS = [6, 12, 24];

  constructor(props: IObsSessionListProps) {
    super(props);

    this.state = {
      currentPage: 1,
      pageSize: ObsSessionList.DEFAULT_PAGE_SIZE,
      searchText: "",
      timelineWindowStartDate: undefined,
      selectedTimelineMonthKey: undefined,
    };

    this.onSelectObsSessionCard = this.onSelectObsSessionCard.bind(this);
  }

  // Forwards card selection to the split-view owner so pagination state can stay local to this list.
  private onSelectObsSessionCard(obsSessionId: number) {
    this.props.onSelectObsSession(obsSessionId);
  }

  // Keeps the visible page in sync with the MUI paginator.
  private onPaginationChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    this.setState({ currentPage: page });
  }

  // Changes the visible density without making the list feel like an infinitely dense data table.
  private onPageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      currentPage: 1,
      pageSize: Number(event.target.value),
    });
  }

  // Filters the already-loaded simple session list so search does not need backend support.
  private onSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      currentPage: 1,
      searchText: event.target.value,
      timelineWindowStartDate: undefined,
    });
  }

  // Clears the local search term while keeping the rest of the list controls intact.
  private onSearchTextClear = () => {
    this.setState({
      currentPage: 1,
      searchText: "",
      timelineWindowStartDate: undefined,
    });
  }

  // Shifts the histogram by one 12-month window and clamps it to the available dated sessions.
  private onTimelineWindowChange = (monthDelta: number, obsSessions: ReadonlyArray<IObsSession>) => {
    const windowBounds = this.getTimelineWindowBounds(obsSessions);
    if (!windowBounds) {
      return;
    }

    const nextStart = this.clampTimelineStart(
      this.addMonths(windowBounds.activeStart, monthDelta),
      windowBounds.earliestStart,
      windowBounds.latestStart
    );

    this.setState({ timelineWindowStartDate: this.toIsoDate(nextStart) });
  }

  // Applies or toggles the month filter when the user clicks a populated distribution bucket.
  private onTimelineMonthFilterChange = (bucket: ITimelineBucket) => {
    if (bucket.count === 0) {
      return;
    }

    this.setState(state => ({
      currentPage: 1,
      selectedTimelineMonthKey: state.selectedTimelineMonthKey === bucket.key ? undefined : bucket.key,
    }));
  }

  // Clears only the distribution month filter, leaving search text and the current 12-month window intact.
  private clearTimelineMonthFilter = () => {
    this.setState({
      currentPage: 1,
      selectedTimelineMonthKey: undefined,
    });
  }

  // Sorts latest sessions first while using the id as a stable fallback for sessions on the same date.
  private sortByDate(obsSessionA: IObsSession, obsSessionB: IObsSession) {
    const dateA = new Date(obsSessionA.date || "").getTime() || 0;
    const dateB = new Date(obsSessionB.date || "").getTime() || 0;
    const idA = obsSessionA.id || 0;
    const idB = obsSessionB.id || 0;
    return dateB - dateA || idB - idA;
  }

  // Applies search and sort before the optional timeline filter so the histogram still shows the searched date context.
  private getSortedSearchFilteredSessions() {
    const obsSessionsModifiable = [...this.props.obsSessions];
    return obsSessionsModifiable
      .sort(this.sortByDate)
      .filter(session => this.matchesSearch(session));
  }

  // Applies the selected month from the distribution control to the already search-filtered sessions.
  private applyTimelineMonthFilter(obsSessions: ReadonlyArray<IObsSession>) {
    if (!this.state.selectedTimelineMonthKey) {
      return obsSessions;
    }

    return obsSessions.filter(session => {
      const sessionDate = this.parseSessionDate(session.date);
      if (!sessionDate) {
        return false;
      }

      const sessionMonthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;
      return sessionMonthKey === this.state.selectedTimelineMonthKey;
    });
  }

  // Searches the fields that are useful for finding a remembered session without adding backend fields yet.
  private matchesSearch(obsSession: IObsSession) {
    const query = this.state.searchText.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      obsSession.title,
      obsSession.date,
      obsSession.location?.name,
      obsSession.summary,
      obsSession.instrument?.name,
    ]
      .filter(Boolean)
      .some(value => value?.toString().toLowerCase().includes(query));
  }

  // Parses the API's yyyy-MM-dd date string as a local date to avoid timezone day shifts in month grouping.
  private parseSessionDate(date?: string) {
    const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return undefined;
    }

    const parsedDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  // Returns the first day of the month for stable timeline window math.
  private getMonthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  // Adds whole months while staying on the first day of the target month.
  private addMonths(date: Date, monthDelta: number) {
    return new Date(date.getFullYear(), date.getMonth() + monthDelta, 1);
  }

  // Stores timeline window state as an ISO-like local date string.
  private toIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  }

  // Keeps a requested timeline window between the earliest and latest useful 12-month windows.
  private clampTimelineStart(date: Date, earliestStart: Date, latestStart: Date) {
    if (date.getTime() < earliestStart.getTime()) {
      return earliestStart;
    }

    if (date.getTime() > latestStart.getTime()) {
      return latestStart;
    }

    return date;
  }

  // Resolves the active 12-month histogram window from current data and optional user navigation state.
  private getTimelineWindowBounds(obsSessions: ReadonlyArray<IObsSession>) {
    const dates = obsSessions
      .map(session => this.parseSessionDate(session.date))
      .filter((date): date is Date => !!date && !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return undefined;
    }

    const earliestStart = this.getMonthStart(dates[0]);
    const latestSessionMonth = this.getMonthStart(dates[dates.length - 1]);
    const latestStartCandidate = this.addMonths(latestSessionMonth, -11);
    const latestStart = latestStartCandidate.getTime() < earliestStart.getTime()
      ? earliestStart
      : latestStartCandidate;
    const requestedStart = this.state.timelineWindowStartDate
      ? this.parseSessionDate(this.state.timelineWindowStartDate)
      : latestStart;
    const activeStart = this.clampTimelineStart(requestedStart || latestStart, earliestStart, latestStart);

    return {
      activeStart,
      earliestStart,
      latestStart,
    };
  }

  // Groups the active 12-month window into one bucket per month, including months with no sessions.
  private buildTimelineBuckets(obsSessions: ReadonlyArray<IObsSession>, windowStart: Date): ITimelineBucket[] {
    const buckets = Array.from({ length: 12 }).map((_, index) => {
      const bucketDate = this.addMonths(windowStart, index);
      return {
        key: `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, "0")}`,
        label: bucketDate.toLocaleDateString(undefined, { month: "short" }),
        count: 0,
      };
    });
    const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]));

    obsSessions.forEach(session => {
      const date = this.parseSessionDate(session.date);
      if (!date) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.count += 1;
      }
    });

    return buckets;
  }

  // Provides compact date range parts for the active 12-month histogram window.
  private getTimelineWindowLabels(windowStart: Date) {
    const windowEnd = this.addMonths(windowStart, 11);
    const startLabel = windowStart.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    const endLabel = windowEnd.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    return { startLabel, endLabel };
  }

  // Formats the active distribution filter for the clear-filter affordances.
  private getSelectedTimelineMonthLabel() {
    if (!this.state.selectedTimelineMonthKey) {
      return undefined;
    }

    const [year, month] = this.state.selectedTimelineMonthKey.split("-").map(Number);
    if (!year || !month) {
      return undefined;
    }

    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  // Renders a small histogram preview so the list has temporal context without becoming a dashboard.
  private renderTimeline(obsSessions: ReadonlyArray<IObsSession>) {
    const { classes } = this.props;
    const windowBounds = this.getTimelineWindowBounds(obsSessions);
    const buckets = windowBounds ? this.buildTimelineBuckets(obsSessions, windowBounds.activeStart) : [];
    const maxCount = Math.max(...buckets.map(bucket => bucket.count), 1);
    const canGoBack = !!windowBounds && windowBounds.activeStart.getTime() > windowBounds.earliestStart.getTime();
    const canGoForward = !!windowBounds && windowBounds.activeStart.getTime() < windowBounds.latestStart.getTime();
    const selectedMonthLabel = this.getSelectedTimelineMonthLabel();
    const windowLabels = windowBounds ? this.getTimelineWindowLabels(windowBounds.activeStart) : undefined;

    return (
      <div className={classes.timelinePanel}>
        <div className={classes.timelineHeader}>
          <TimelineIcon fontSize="small" />
          <Typography variant="caption">
            Session distribution
            {windowLabels ? (
              <span className={classes.timelineRange}>
                <span className={classes.timelineRangeEndpoint}>{windowLabels.startLabel}</span>
                <span className={classes.timelineRangeSeparator}>to</span>
                <span className={classes.timelineRangeEndpoint}>{windowLabels.endLabel}</span>
              </span>
            ) : (
              " No dated sessions"
            )}
          </Typography>
          {selectedMonthLabel && (
            <Button
              className={classNames(classes.clearFilterButton, classes.timelineHeaderClear)}
              onClick={this.clearTimelineMonthFilter}
              size="small"
              startIcon={<CloseIcon fontSize="small" />}
            >
              Clear filter
            </Button>
          )}
        </div>
        {windowBounds ? (
          <div className={classes.timelineWindow}>
            <IconButton
              aria-label="Show previous year of sessions"
              className={classes.timelineNavButton}
              disabled={!canGoBack}
              onClick={() => this.onTimelineWindowChange(-12, obsSessions)}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>
            <div className={classes.timelineBars} aria-label="Session distribution over time">
              {buckets.map(bucket => (
                <button
                  key={bucket.key}
                  aria-label={`Filter sessions to ${bucket.label}`}
                  aria-pressed={this.state.selectedTimelineMonthKey === bucket.key}
                  className={classNames(classes.timelineBucket, {
                    [classes.timelineBucketActive]: this.state.selectedTimelineMonthKey === bucket.key,
                  })}
                  disabled={bucket.count === 0}
                  onClick={() => this.onTimelineMonthFilterChange(bucket)}
                  title={`${bucket.label}: ${bucket.count} sessions`}
                  type="button"
                >
                  <div className={classes.timelineBarTrack}>
                    <div
                      className={classes.timelineBar}
                      style={{ height: bucket.count > 0 ? `${Math.max((bucket.count / maxCount) * 100, 8)}%` : 0 }}
                    />
                  </div>
                  <span className={classes.timelineLabel}>{bucket.label}</span>
                </button>
              ))}
            </div>
            <IconButton
              aria-label="Show next year of sessions"
              className={classes.timelineNavButton}
              disabled={!canGoForward}
              onClick={() => this.onTimelineWindowChange(12, obsSessions)}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          </div>
        ) : (
          <Typography variant="caption" color="textSecondary">
            Add dated sessions to see the distribution.
          </Typography>
        )}
      </div>
    );
  }

  // Renders the search, density selector, and filtered result count above the cards.
  private renderListControls(filteredCount: number) {
    const { classes } = this.props;
    const totalCount = this.props.obsSessions.length;
    const selectedMonthLabel = this.getSelectedTimelineMonthLabel();

    return (
      <div className={classes.controls}>
        <div className={classes.controlsRow}>
          <TextField
            className={classes.searchField}
            fullWidth={true}
            label="Search sessions"
            margin="dense"
            onChange={this.onSearchTextChange}
            placeholder="Title, date, location, instrument"
            size="small"
            value={this.state.searchText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: this.state.searchText ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Clear session search"
                    edge="end"
                    onClick={this.onSearchTextClear}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <TextField
            className={classes.pageSizeField}
            label="Rows"
            margin="dense"
            onChange={this.onPageSizeChange}
            select={true}
            size="small"
            value={this.state.pageSize}
          >
            {ObsSessionList.PAGE_SIZE_OPTIONS.map(pageSize => (
              <MenuItem key={pageSize} value={pageSize}>
                {pageSize}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <Typography className={classes.resultMeta} variant="caption">
          <span className={classes.resultMetaLeft}>
            <span>{filteredCount} shown</span>
            {selectedMonthLabel && (
              <Button
                className={classes.clearFilterButton}
                onClick={this.clearTimelineMonthFilter}
                size="small"
                startIcon={<CloseIcon fontSize="small" />}
              >
                Clear filter
              </Button>
            )}
          </span>
          <span>{totalCount} total</span>
        </Typography>
      </div>
    );
  }

  public render() {
    if (this.props.obsSessions) {
      if (this.props.obsSessions.length > 0) {
        const searchFilteredSessions = this.getSortedSearchFilteredSessions();
        const filteredSessions = this.applyTimelineMonthFilter(searchFilteredSessions);
        const pageCount = Math.max(Math.ceil(filteredSessions.length / this.state.pageSize), 1);
        const currentPage = Math.min(this.state.currentPage, pageCount);
        const obsSessions = filteredSessions
          .slice((currentPage - 1) * this.state.pageSize, currentPage * this.state.pageSize)
          .map(o => (
            <ObsSessionCard
              key={o.id}
              isSelected={!!o.id && o.id === this.props.selectedObsSessionId}
              onSelectObsSessionCard={this.onSelectObsSessionCard}
              obsSession={o}
            />
          ));

        const paginator = <div className={this.props.classes.paginator}>
          <Pagination
            page={currentPage}
            count={pageCount}
            onChange={this.onPaginationChange}
          />
        </div>;

        return (
          <>
            {this.renderListControls(filteredSessions.length)}
            {this.renderTimeline(searchFilteredSessions)}
            {paginator}
            <div className="obsSessionList">
              {obsSessions.length > 0 ? obsSessions : (
                <Typography variant="caption" color="textSecondary">
                  No sessions match the current filters.
                </Typography>
              )}
            </div>
            {paginator}
          </>
        );
      } else {
        return <Typography variant="caption" color="textSecondary" >
          No observation sessions!
        </Typography>;
      }
    } else {
      return <div>Unable to load observation session</div>;
    }
  }
}

export default withStyles(styles)(ObsSessionList);
