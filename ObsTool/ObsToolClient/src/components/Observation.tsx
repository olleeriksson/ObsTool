/*
 * Component for an observation, when it's listed on its own, which means it also has to say what DSO it belongs to.
 */
import * as React from "react";
import "./Observation.css";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import { IEyepiece, IObservation } from "../types/Types";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import classNames from "classnames";
import DsoCard from "./DsoCard";
import ObservationSecondary from "./ObservationSecondary";
import ImageList from "./ImageList";
import ObsInstrumentBadge from "./ObsInstrumentBadge";
import { getEyepiecesCached, renderReportTextAnnotated } from "./ReportTextAnnotated";
import { getObservedObjectTargetId, getObservedObjectTargetKey } from "./ObservationTarget";

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
    maxWidth: "100 %",
    padding: theme.spacing(1),
    paddingTop: theme.spacing(2),
  },
  image: {
    margin: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    margin: "auto",
    display: "block",
    maxWidth: "100%",
    maxHeight: "100%",
  },
  expand: {
    transform: "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
    marginLeft: "auto",
    [theme.breakpoints.up("sm")]: {
      marginRight: -8,
    },
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
  backToFormButton: {
    color: theme.palette.grey[500],
  },
  instrumentBadgeColumn: {
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
    width: 70,
  },
});

export interface IObservationProps extends WithStyles<typeof styles> {
  observation: IObservation;
  observationIndex: number;
  onSelectObservation: (id: number) => void;
  onBackToForm: () => void;
  onResourcesChanged?: (observationId: number, resources: IObservation["obsResources"]) => void;
  allowEditing: boolean;
}

export interface IObservationState {
  isExpanded: boolean;
  eyepieces: IEyepiece[];
}

class Observation extends React.Component<IObservationProps, IObservationState> {
  constructor(props: IObservationProps) {
    super(props);

    this.state = {
      isExpanded: false,
      eyepieces: [],
    };

    this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  public componentDidMount() {
    getEyepiecesCached().then(eyepieces => this.setState({ eyepieces }));
  }

  private sortByObsSessionDateDesc = (observationA: IObservation, observationB: IObservation) => {
    const dateA = observationA.obsSession?.date ? new Date(observationA.obsSession.date).getTime() : 0;
    const dateB = observationB.obsSession?.date ? new Date(observationB.obsSession.date).getTime() : 0;
    return dateB - dateA;
  }

  public render() {
    const { classes } = this.props;

    let expandedGridItem;
    if (this.state.isExpanded) {

      let otherObservations;
      if (this.props.observation.otherObservations) {
        otherObservations = [...this.props.observation.otherObservations]
          .sort(this.sortByObsSessionDateDesc)
          .map(otherObs =>
          <ObservationSecondary key={otherObs.id} observation={otherObs} showPrevAndNextObservation={true} />
        );
      }

      expandedGridItem = (
        <div style={{ marginLeft: "1em", marginTop: -10, marginBottom: "0.em" }}>
          <Typography variant="subtitle1">
            <strong>Other observations</strong>
          </Typography>
          {otherObservations}
        </div>
      );
    }

    let expandButton;
    if (this.props.observation.otherObservations && this.props.observation.otherObservations.length > 0) {
      expandButton = (
        <IconButton
          className={classNames(classes.expand, { [classes.expandOpen]: this.state.isExpanded })}
          onClick={this.handleExpandClick}
          aria-expanded={this.state.isExpanded}
          aria-label="Show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      );
    }

    let dsoObjects;
    if (this.props.observation.dsoObservations) {
      dsoObjects = this.props.observation.dsoObservations.map((o, dsoObsIndex) => {
        const targetKey = getObservedObjectTargetKey(this.props.observation, this.props.observationIndex, o, dsoObsIndex);
        return (
          <div key={targetKey} id={getObservedObjectTargetId(targetKey)} style={{ marginBottom: "0.4em", scrollMarginTop: "1em" }}>
            <DsoCard
              dso={o.dso}
              nonDetection={o.nonDetection || this.props.observation.nonDetection}
              showBadge={false}
              showDsoAnnotations={true}
              showDsoExtra={true}
              showObservations={false}
              showPrevAndNextObservation={false}
              startWithObservationsExpanded={false}
            />
          </div>
        );
      });
    }

    return (
      <Paper className={classes.root}>
        <Grid container spacing={2} direction="column">
          <Grid size={12}>
            <Grid container spacing={2} wrap="nowrap">
              <Grid className={classes.instrumentBadgeColumn}>
                <ObsInstrumentBadge
                  instrument={this.props.observation.instrument}
                  compact={true}
                  iconSize={50}
                  labelWidth={48}
                  imageClassName={classes.image}
                />
              </Grid>
              <Grid size={{ xs: 11, sm: "grow" }}>
                <Grid container direction="column" spacing={2}>
                  <Grid size="grow">
                    {dsoObjects}
                    <div style={{ marginTop: "0.8em", marginBottom: "1em" }}>
                      <Typography variant="body2" gutterBottom={true}>
                        {renderReportTextAnnotated(
                          this.props.observation.text,
                          this.props.observation.instrument || this.props.observation.obsSession?.instrument,
                          this.state.eyepieces
                        )}
                      </Typography>
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <ImageList
                        observationId={this.props.observation.id}
                        resources={this.props.observation.obsResources}
                        onResourcesChanged={this.props.onResourcesChanged}
                        showAddButton={this.props.allowEditing}
                      />
                    </div>
                  </Grid>
                </Grid>
              </Grid>
              <Grid>
                <Grid container direction="column" style={{ height: "100%" }}>
                  <Grid size="grow">
                    <IconButton className={classes.backToFormButton} onClick={this.props.onBackToForm} aria-label="Back to observation form">
                      <ArrowBackIcon />
                    </IconButton>
                  </Grid>
                  <Grid>
                    {expandButton}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          {expandedGridItem}
        </Grid>
      </Paper>
    );
  }
}

export default withStyles(styles)(Observation);


