import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import { IDso } from "../types/Types";
import DsoExtra from "./DsoExtra";
import DsoTitle from "./DsoTitle";
import Badge from "@mui/material/Badge";
// import ObservationSecondary from "./ObservationSecondary";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import classNames from "classnames";
import ObservationSecondary from "./ObservationSecondary";
import Typography from "@mui/material/Typography";
import DsoAnnotations from "./DsoAnnotations";
import CosmosIcon from "../cosmos.svg";
import HerschelBadge from "./HerschelBadge";
import Api from "../api/Api";
import { IHerschelDetails } from "../types/Types";

const styles = (theme: Theme) => createStyles({
  root: {
    top: 20,
    right: -15,
  },
  badge: {
  },
  expandDiv: {
    width: 50
  },
  titleRow: {
    alignItems: "center",
    display: "flex",
    marginBottom: theme.spacing(0),
  },
  expandButton: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
    marginLeft: 20,
    [theme.breakpoints.up("sm")]: {
      marginRight: -8,
    },
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  herschelDetails: {
    marginLeft: "1.5em",
    marginTop: theme.spacing(1),
  },
  herschelDetailRow: {
    borderLeft: "3px solid #f5c542",
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  descrButton: {
    marginLeft: theme.spacing(0.5),
    padding: 0,
  },
});

interface IDsoCardProps extends WithStyles<typeof styles> {
  dso?: IDso;
  customObjectName?: string;
  error?: string;
  nonDetection?: boolean;
  showBadge?: boolean;
  showDsoAnnotations?: boolean;
  showDsoExtra?: boolean;
  showObservations?: boolean;
  showPrevAndNextObservation?: boolean;
  startWithObservationsExpanded?: boolean;
  allowHerschelDetails?: boolean;
}

interface IDynamicDsoLabelState {
  isExpanded: boolean;
  isHerschelExpanded: boolean;
  herschelDetails?: IHerschelDetails[];
  isHerschelLoading: boolean;
  expandedHerschelIds: number[];
}

/*
This renders a DSO label, optional catalog details, and optional observation expansion.
It's used both for search-style DSO rows and for DSO headers inside observation cards.
*/
class DsoCard extends React.Component<IDsoCardProps, IDynamicDsoLabelState> {
  constructor(props: IDsoCardProps) {
    super(props);

    this.state = {
      isExpanded: !!this.props.startWithObservationsExpanded,
      isHerschelExpanded: false,
      isHerschelLoading: false,
      expandedHerschelIds: [],
    };
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  private handleHerschelExpandClick = () => {
    const nextExpanded = !this.state.isHerschelExpanded;
    this.setState({ isHerschelExpanded: nextExpanded });

    const dso = this.props.dso;
    if (nextExpanded && dso && !this.state.herschelDetails && !this.state.isHerschelLoading) {
      this.setState({ isHerschelLoading: true });
      Api.getHerschelDetails(dso.id).then(response => {
        this.setState({ herschelDetails: response.data, isHerschelLoading: false });
      }).catch(() => {
        this.setState({ herschelDetails: [], isHerschelLoading: false });
      });
    }
  }

  private toggleDescrLong = (herschelId: number) => {
    this.setState(prevState => {
      const isExpanded = prevState.expandedHerschelIds.includes(herschelId);
      return {
        expandedHerschelIds: isExpanded
          ? prevState.expandedHerschelIds.filter(id => id !== herschelId)
          : [...prevState.expandedHerschelIds, herschelId]
      };
    });
  }

  public render() {
    const { classes } = this.props;
    const dso = this.props.dso;

    if (this.props.error) {
      return (
        <Typography color="error" gutterBottom={true}>
          {this.props.error}
        </Typography>
      );
    }

    if (!dso) {
      return (
        <Typography color="textSecondary" gutterBottom={true}>
          Error!
        </Typography>
      );
    }

    if (dso.name === "custom") {
      return (
        <Grid container>
          <Grid size={"auto"}>
            <img src={CosmosIcon} width="20" height="20" style={{ marginRight: 10, marginTop: 2 }} />
          </Grid>
          <Grid size={"grow"}>
            <Typography variant="subtitle1">
              Custom object: {this.props.customObjectName}
            </Typography>
          </Grid>
        </Grid>
      );
    }

    let expandButton;
    if (this.props.showObservations && dso.observations && dso.observations.length > 0) {
      expandButton = (
        <IconButton
          className={classNames(classes.expandButton, { [classes.expandOpen]: this.state.isExpanded })}
          onClick={this.handleExpandClick}
          aria-expanded={this.state.isExpanded}
          aria-label="Show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      );
    }

    const showObservedBadge = !!this.props.showBadge && (dso.numObservations || 0) > 0;
    const dsoSearchLabel = showObservedBadge
      ? (
        <Badge className={classes.badge} badgeContent={dso.numObservations} color="secondary">
          <DsoTitle dso={dso} nonDetection={this.props.nonDetection} />
        </Badge>
      )
      : <DsoTitle dso={dso} nonDetection={this.props.nonDetection} />;

    const dsoAnnotations = (showObservedBadge || this.props.showDsoAnnotations) && (
      <>
        <span style={{ marginLeft: "1.2em" }} />
        <DsoAnnotations
          rating={dso.dsoExtra && dso.dsoExtra.rating}
          followUp={dso.dsoExtra && dso.dsoExtra.followUp}
        />
      </>
    );

    const dsoExtra = this.props.showDsoExtra && (
      <DsoExtra dso={dso} />
    );

    const allowHerschelDetails = this.props.allowHerschelDetails !== false;
    const herschelBadge = dso.herschelObjects && dso.herschelObjects.length > 0 && (
      <Grid size={"auto"} style={{ marginTop: "1em" }}>
        <HerschelBadge
          herschelObjects={dso.herschelObjects}
          allowDetails={allowHerschelDetails}
          isExpanded={this.state.isHerschelExpanded}
          onClick={this.handleHerschelExpandClick}
        />
      </Grid>
    );

    const expandObservations = this.props.showObservations && (
      <Grid size={"auto"}>
        <div className={classes.expandDiv}>
          {expandButton}
        </div>
      </Grid>
    );

    const dsoLabel = (
      <Grid container>
        <Grid size={"auto"}>
          <img src={CosmosIcon} width="20" height="20" style={{ marginRight: 10, marginTop: 2 }} />
        </Grid>
        <Grid size={"grow"}>
          <div className={classes.titleRow}>
            {dsoSearchLabel}
            {dsoAnnotations}
          </div>
          {dsoExtra}
        </Grid>
        {herschelBadge}
        {expandObservations}
      </Grid>
    );

    let observationsSection;
    if (this.state.isExpanded) {

      let observations;
      if (dso.observations) {
        observations = dso.observations.map(obs =>
          <ObservationSecondary key={obs.id} observation={obs} showPrevAndNextObservation={!!this.props.showPrevAndNextObservation} />
        );
      }

      observationsSection = (
        <div style={{marginLeft: "1.5em"}}>
          <Typography gutterBottom={true} style={{ marginTop: "0.5em" }} variant="subtitle1">
            <strong>Observations</strong>
          </Typography>
          {observations}
        </div>
      );
    }

    let herschelDetailsSection;
    if (this.state.isHerschelExpanded && allowHerschelDetails) {
      const details = this.state.herschelDetails || [];
      const detailRows = details.map(detail => {
        const isDescrExpanded = this.state.expandedHerschelIds.includes(detail.herschelId);
        return (
          <div key={detail.herschelId} className={classes.herschelDetailRow}>
            <Typography variant="body2">
              <strong>{detail.herschelNo}</strong>
              {detail.h400 ? " H400" : ""}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {detail.herschelSummary || "No William Herschel summary found."}
            </Typography>
            {detail.descrLong && (
              <>
                <button className={classes.descrButton} type="button" onClick={() => this.toggleDescrLong(detail.herschelId)}>
                  {isDescrExpanded ? "Hide full description" : "Show full description"}
                </button>
                {isDescrExpanded && (
                  <Typography variant="body2" style={{ whiteSpace: "pre-wrap" }}>
                    {detail.descrLong}
                  </Typography>
                )}
              </>
            )}
          </div>
        );
      });

      herschelDetailsSection = (
        <div className={classes.herschelDetails}>
          <Typography gutterBottom={true} variant="subtitle1">
            <strong>Herschel</strong>
          </Typography>
          {this.state.isHerschelLoading ? (
            <Typography variant="body2" color="textSecondary">Loading...</Typography>
          ) : detailRows}
        </div>
      );
    }

    return (
      <div>
        {dsoLabel}
        {herschelDetailsSection}
        {observationsSection}
      </div>
    );
  }
}

export default withStyles(styles)(DsoCard);
