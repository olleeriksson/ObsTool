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
}

interface IDynamicDsoLabelState {
  isExpanded: boolean;
}

/*
This renders a DSO label, optional catalog details, and optional observation expansion.
It's used both for search-style DSO rows and for DSO headers inside observation cards.
*/
class DsoCard extends React.Component<IDsoCardProps, IDynamicDsoLabelState> {
  constructor(props: IDsoCardProps) {
    super(props);

    this.state = {
      isExpanded: !!this.props.startWithObservationsExpanded
    };
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
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

    const expandDiv = this.props.showObservations && (
      <div className={classes.expandDiv}>
        {expandButton}
      </div>
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
        <Grid size={"auto"}>
          {expandDiv}
        </Grid>
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

    return (
      <div>
        {dsoLabel}
        {observationsSection}
      </div>
    );
  }
}

export default withStyles(styles)(DsoCard);
