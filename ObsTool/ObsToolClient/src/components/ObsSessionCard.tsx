import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { DsoTypeIcon } from "./DsoTypeIcon";
import classNames from "classnames";
import { IObsSession } from "../types/Types";

const styles = (theme: Theme) => createStyles({
  paper: {
    border: `1px solid ${theme.palette.divider}`,
    cursor: "pointer",
    margin: theme.spacing(1, 0),
    padding: theme.spacing(1.25),
    transition: theme.transitions.create(["border-color", "box-shadow", "background-color"], {
      duration: theme.transitions.duration.shortest,
    }),
    "&:hover": {
      borderColor: theme.palette.primary.light,
      boxShadow: theme.shadows[2],
    },
    "&:focus-visible": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
      outline: "none",
    },
  },
  selectedPaper: {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.main,
  },
  mainRowContainer: {
    alignItems: "center",
    flexGrow: 1,
    maxWidth: "100%",
  },
  dateBadgeColumn: {
    alignSelf: "flex-start",
  },
  dateBadge: {
    alignItems: "center",
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.secondary,
    display: "grid",
    gridTemplateRows: "auto auto auto",
    justifyItems: "center",
    minWidth: 58,
    padding: theme.spacing(0.75),
  },
  dateBadgeIcon: {
    color: theme.palette.primary.main,
    fontSize: "1rem",
    marginBottom: 2,
  },
  dateBadgeMonth: {
    fontSize: "0.65rem",
    fontWeight: 700,
    lineHeight: 1,
    textTransform: "uppercase",
  },
  dateBadgeDay: {
    color: theme.palette.text.primary,
    fontSize: "1.2rem",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  dateBadgeYear: {
    fontSize: "0.65rem",
    lineHeight: 1,
  },
  header: {
    flexGrow: 1,
    minWidth: 0,
  },
  titleLine: {
    alignItems: "baseline",
    display: "flex",
    gap: theme.spacing(0.75),
    minWidth: 0,
  },
  title: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
  metaLine: {
    color: theme.palette.text.secondary,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  objectStatsLine: {
    alignItems: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
    minWidth: 0,
  },
  objectStat: {
    alignItems: "center",
    // backgroundColor: theme.palette.action.hover,
    // border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    display: "inline-flex",
    gap: 3,
    minHeight: 22,
    padding: theme.spacing(0.2, 0.5),
  },
  summaryPreview: {
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    marginTop: theme.spacing(0.75),
    overflow: "hidden",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
  },
  buttons: {
    alignSelf: "start",
  },
  expand: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  expandedContent: {
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    width: "100%",
  },
  detailGrid: {
    display: "grid",
    gap: theme.spacing(1),
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  detailBlock: {
    minWidth: 0,
  },
  summaryDetailBlock: {
    gridColumn: "1 / -1",
  },
  detailLabel: {
    color: theme.palette.text.secondary,
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  metricRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(1),
  },
  metric: {
    backgroundColor: theme.palette.action.hover,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 0.75),
  },
});

export interface IObsSessionCardProps extends WithStyles<typeof styles> {
  obsSession: IObsSession;
  isSelected?: boolean;
  onSelectObsSessionCard: (obsSessionId: number) => void;
}

interface IObsSessionCardState {
  isExpanded: boolean;
}

interface IMetricItem {
  label: string;
  value: string;
}

interface IObjectStatItem {
  label: string;
  type?: string;
  value: number;
}

class ObsSessionCard extends React.Component<IObsSessionCardProps, IObsSessionCardState> {
  constructor(props: IObsSessionCardProps) {
    super(props);

    this.state = {
      isExpanded: false
    };

    this.handleClickOnObsSession = this.handleClickOnObsSession.bind(this);
  }

  // Toggles only the inline details; it deliberately does not select or navigate the session.
  private handleExpandClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    this.setState(state => ({ isExpanded: !state.isExpanded }));
  }

  // Selects the card when the user clicks anywhere on the card body.
  public handleClickOnObsSession() {
    if (this.props.obsSession.id) {
      this.props.onSelectObsSessionCard(this.props.obsSession.id);
    }
  }

  // Gives keyboard users the same card-selection behavior as pointer users.
  private handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClickOnObsSession();
    }
  }

  // Builds the compact instrument label without showing missing measurements as primary content.
  private getInstrumentText() {
    const instrument = this.props.obsSession.instrument;
    if (!instrument) {
      return undefined;
    }

    const measurements = [
      instrument.diameterMm !== undefined && instrument.diameterMm !== null ? `${instrument.diameterMm} mm` : undefined,
      instrument.focalLengthMm !== undefined && instrument.focalLengthMm !== null ? `FL ${instrument.focalLengthMm} mm` : undefined,
    ].filter(Boolean);

    return measurements.length > 0
      ? `${instrument.name} (${measurements.join(", ")})`
      : instrument.name;
  }

  // Parses yyyy-MM-dd as local date parts so the badge cannot shift a day due to timezone conversion.
  private getDateParts() {
    const date = this.props.obsSession.date;
    const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return undefined;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const monthLabel = new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short" });

    return {
      day: day.toString(),
      month: monthLabel,
      year: year.toString(),
    };
  }

  // Returns only entered quality measurements so rare fields do not dominate the card layout.
  private getMetricItems(): IMetricItem[] {
    const { obsSession } = this.props;
    return [
      obsSession.seeing !== undefined && obsSession.seeing !== null ? { label: "Seeing", value: obsSession.seeing.toString() } : undefined,
      obsSession.transparency !== undefined && obsSession.transparency !== null ? { label: "Transparency", value: obsSession.transparency.toString() } : undefined,
      obsSession.limitingMagnitude !== undefined && obsSession.limitingMagnitude !== null ? { label: "LM", value: obsSession.limitingMagnitude.toString() } : undefined,
    ].filter((item): item is IMetricItem => !!item);
  }

  // Builds the compact object-stat chips rendered on the card summary line.
  private getObjectStatItems(): IObjectStatItem[] {
    const objectStats = this.props.obsSession.objectStats;
    if (!objectStats) {
      return [];
    }

    return [
      { label: "Objects", value: objectStats.total },
      { label: "Galaxies", type: "GALXY", value: objectStats.galaxies },
      { label: "Nebulae", type: "BRTNB", value: objectStats.nebulae },
      { label: "Clusters", type: "OPNCL", value: objectStats.clusters },
      { label: "Other", type: "OTHER", value: objectStats.other },
    ].filter(item => item.label === "Objects" || item.value > 0);
  }

  // Renders broad observed-object counts without taking over the card's main title/date scan path.
  private renderObjectStats() {
    const { classes } = this.props;
    const objectStats = this.getObjectStatItems();

    if (objectStats.length === 0) {
      return undefined;
    }

    return (
      <div className={classes.objectStatsLine}>
        {objectStats.map(item => (
          <Typography key={item.label} className={classes.objectStat} variant="caption" title={item.label}>
            {item.type && <DsoTypeIcon type={item.type} size={14} />}
            <span>{item.label === "Objects" ? `${item.value} obj` : item.value}</span>
          </Typography>
        ))}
      </div>
    );
  }

  // Renders optional detail fields in a compact layout instead of a long N/A-heavy vertical stack.
  private renderExpandedContent(instrumentText?: string) {
    const { classes, obsSession } = this.props;
    const metrics = this.getMetricItems();
    const conditions = obsSession.conditions?.trim();
    const hasDetails = obsSession.summary || instrumentText || conditions || metrics.length > 0;

    if (!this.state.isExpanded) {
      return undefined;
    }

    return (
      <Grid size={12}>
        <div className={classes.expandedContent}>
          {hasDetails ? (
            <>
              <div className={classes.detailGrid}>
                {obsSession.summary && (
                  <div className={classNames(classes.detailBlock, classes.summaryDetailBlock)}>
                    <span className={classes.detailLabel}>Summary</span>
                    <Typography variant="body2">{obsSession.summary}</Typography>
                  </div>
                )}
                {instrumentText && (
                  <div className={classes.detailBlock}>
                    <span className={classes.detailLabel}>Instrument</span>
                    <Typography variant="body2">{instrumentText}</Typography>
                  </div>
                )}
                {conditions && (
                  <div className={classes.detailBlock}>
                    <span className={classes.detailLabel}>Conditions</span>
                    <Typography variant="body2">{conditions}</Typography>
                  </div>
                )}
              </div>
              {metrics.length > 0 && (
                <div className={classes.metricRow}>
                  {metrics.map(metric => (
                    <Typography key={metric.label} className={classes.metric} variant="caption">
                      <strong>{metric.label}:</strong> {metric.value}
                    </Typography>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Typography variant="caption" color="textSecondary">
              No additional session details.
            </Typography>
          )}
        </div>
      </Grid>
    );
  }

  public render() {
    const { classes, obsSession } = this.props;
    const instrumentText = this.getInstrumentText();
    const dateParts = this.getDateParts();
    const dateLocationSeparator = obsSession.date &&
      obsSession.location && obsSession.location.name && " - ";

    return (
      <Paper
        className={classNames(classes.paper, { [classes.selectedPaper]: this.props.isSelected })}
        elevation={this.props.isSelected ? 2 : 0}
        onClick={this.handleClickOnObsSession}
        onKeyDown={this.handleCardKeyDown}
        role="button"
        tabIndex={0}
      >
        <Grid container spacing={1}>
          <Grid size={12}>
            <Grid container spacing={1.25} className={classes.mainRowContainer}>
              <Grid className={classes.dateBadgeColumn}>
                <div className={classes.dateBadge} aria-hidden="true">
                  <EventNoteIcon className={classes.dateBadgeIcon} />
                  {dateParts ? (
                    <>
                      <span className={classes.dateBadgeMonth}>{dateParts.month}</span>
                      <span className={classes.dateBadgeDay}>{dateParts.day}</span>
                      <span className={classes.dateBadgeYear}>{dateParts.year}</span>
                    </>
                  ) : (
                    <span className={classes.dateBadgeMonth}>Date</span>
                  )}
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: "grow" }} className={classes.header}>
                <div className={classes.titleLine}>
                  <Typography className={classes.title} variant="subtitle1">
                    {obsSession.title || "Untitled session"}
                  </Typography>
                </div>
                <Typography className={classes.metaLine} variant="caption">
                  {obsSession.date && obsSession.date.toString()}
                  {dateLocationSeparator}
                  {obsSession.location && obsSession.location.name}
                </Typography>
                {this.renderObjectStats()}
                {obsSession.summary && (
                  <Typography className={classes.summaryPreview} variant="body2">
                    {obsSession.summary}
                  </Typography>
                )}
              </Grid>
              <Grid className={classes.buttons}>
                <IconButton
                  size="small"
                  className={classNames(classes.expand, { [classes.expandOpen]: this.state.isExpanded })}
                  onClick={this.handleExpandClick}
                  aria-expanded={this.state.isExpanded}
                  aria-label={this.state.isExpanded ? "Hide session details" : "Show session details"}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
          {this.renderExpandedContent(instrumentText)}
        </Grid>
      </Paper>
    );
  }
}

export default withStyles(styles)(ObsSessionCard);
