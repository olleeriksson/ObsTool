/*
 * Component for an observation, when it's listed under a DSO component, so not listed on its own.
 */
import * as React from "react";
import "./Observation.css";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import { IEyepiece, IObservation } from "../types/Types";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import ImageList from "./ImageList";
import ObsInstrumentBadge from "./ObsInstrumentBadge";
import { getEyepiecesCached, renderReportTextAnnotated } from "./ReportTextAnnotated";

const styles = (theme: Theme) => createStyles({
  root: {
    border: "1px dashed lightgray",
    margin: "0.5em",
    padding: theme.spacing(1),
  },
  image: {
    width: 48,
    height: 48,
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
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
});

export interface IObservationSecondaryProps extends WithStyles<typeof styles> {
  observation: IObservation;
  showPrevAndNextObservation: boolean;
}

export interface IObservationSecondaryState {
  isExpanded: boolean;
  isPrevObservationExpanded: boolean;
  isNextObservationExpanded: boolean;
  eyepieces: IEyepiece[];
}

/**
 * This component is for when an observation is shown without the context of an ObsSession. Ie, when showing an observation
 * for example when searching for an object.
 */
class ObservationSecondary extends React.Component<IObservationSecondaryProps, IObservationSecondaryState> {
  static defaultProps = {
    showPrevAndNextObservation: false,
  };

  constructor(props: IObservationSecondaryProps) {
    super(props);

    this.state = {
      isExpanded: true,
      isPrevObservationExpanded: false,
      isNextObservationExpanded: false,
      eyepieces: [],
    };

    this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  private handleExpandPrevObservationClick = () => {
    this.setState({ isPrevObservationExpanded: !this.state.isPrevObservationExpanded });
  }

  private handleExpandNextObservationClick = () => {
    this.setState({ isNextObservationExpanded: !this.state.isNextObservationExpanded });
  }

  public componentDidMount() {
    getEyepiecesCached().then(eyepieces => this.setState({ eyepieces }));
  }

  public render() {
    const { classes } = this.props;

    let expandButton;
    if (this.props.observation.obsResources && this.props.observation.obsResources.length > 0) {
      expandButton = (
        <IconButton
          className={classNames(classes.expand, { [classes.expandOpen]: this.state.isExpanded })}
          onClick={this.handleExpandClick}
        >
          <ExpandMoreIcon />
        </IconButton>
      );
    }

    let expandPrevObservationButton;
    if (this.props.showPrevAndNextObservation && this.props.observation.prevObservation && !this.state.isPrevObservationExpanded) {
      expandPrevObservationButton = (
        <Tooltip title="Click to show previous observation">
          <span onClick={this.handleExpandPrevObservationClick} style={{ cursor: "pointer" }}>... </span>
        </Tooltip>
      );
    }

    let expandNextObservationButton;
    if (this.props.showPrevAndNextObservation && this.props.observation.nextObservation && !this.state.isNextObservationExpanded) {
      expandNextObservationButton = (
        <Tooltip title="Click to show next observation">
          <span onClick={this.handleExpandNextObservationClick} style={{ cursor: "pointer" }}> ...</span>
        </Tooltip>
      );
    }

    let imageListTeaser;
    if (this.props.observation.obsResources && this.props.observation.obsResources.length > 0 && !this.state.isExpanded) {
      imageListTeaser = (
        <Typography variant="caption" onClick={this.handleExpandClick} style={{ cursor: "pointer" }} >
          ({this.props.observation.obsResources.length} resource{this.props.observation.obsResources.length > 1 && "s"}..)
        </Typography>
      );
    }

    let expandedGridItem;
    if (this.state.isExpanded && this.props.observation.obsResources && this.props.observation.obsResources.length > 0) {
      expandedGridItem = (
        <Grid size={12}>
          <ImageList observationId={this.props.observation.id} resources={this.props.observation.obsResources} showAddButton={false} />
        </Grid>
      );
    }

    let expandedPrevObservationItem;
    if (this.state.isPrevObservationExpanded) {
      expandedPrevObservationItem = (
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: "0.5em" }}>
          <span onClick={this.handleExpandPrevObservationClick} style={{ cursor: "pointer" }}>... </span>
          {this.props.observation.prevObservation && renderReportTextAnnotated(
            this.props.observation.prevObservation.text,
            this.props.observation.prevObservation.instrument || this.props.observation.prevObservation.obsSession?.instrument,
            this.state.eyepieces
          )}
        </Typography>
      );
    }

    let expandedNextObservationItem;
    if (this.state.isNextObservationExpanded) {
      expandedNextObservationItem = (
        <Typography variant="body2" color="text.secondary" style={{ marginTop: "0.5em" }}>
          <span onClick={this.handleExpandNextObservationClick} style={{ cursor: "pointer" }}>... </span>
          {this.props.observation.nextObservation && renderReportTextAnnotated(
            this.props.observation.nextObservation.text,
            this.props.observation.nextObservation.instrument || this.props.observation.nextObservation.obsSession?.instrument,
            this.state.eyepieces
          )}
        </Typography>
      );
    }

    const obsSessionId = this.props.observation.obsSession && this.props.observation.obsSession.id;
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
    const obsSessionUrl = baseUrl + "/session/" + obsSessionId;
    const obsSessionDate = this.props.observation.obsSession && this.props.observation.obsSession.date;
    const obsSessionTitle = this.props.observation.obsSession && this.props.observation.obsSession.title && this.props.observation.obsSession.title;
    const obsSessionLocation = this.props.observation.obsSession && this.props.observation.obsSession.location && "(" + this.props.observation.obsSession.location.name + ")";
    return (
      <Grid container spacing={0} direction="column" className={classes.root}>
        <Grid size={12}>
          <Grid container spacing={0} direction="row">
            <Grid>
              <ObsInstrumentBadge
                instrument={this.props.observation.instrument}
                compact={true}
                iconSize={28}
                labelWidth={40}
                nonDetection={this.props.observation.nonDetection}
                nonDetectionIconSize={26}
                imageClassName={classes.image}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: "grow" }}>
              <Grid container direction="column" spacing={2}>
                <Grid size="grow">
                  <Typography variant="body2" style={{ marginBottom: "0.5em" }}>
                    <a href={obsSessionUrl}>
                      {obsSessionDate} &nbsp;
                      {obsSessionTitle} &nbsp;
                      {obsSessionLocation}
                    </a>
                  </Typography>
                  {expandedPrevObservationItem}
                  <Typography variant="body2">
                    {expandPrevObservationButton}
                    {renderReportTextAnnotated(
                      this.props.observation.text,
                      this.props.observation.instrument || this.props.observation.obsSession?.instrument,
                      this.state.eyepieces
                    )}
                    {expandNextObservationButton}
                  </Typography>
                  {expandedNextObservationItem}
                  {imageListTeaser}
                </Grid>
                {expandedGridItem}
              </Grid>
            </Grid>
            <Grid>
              <Grid container direction="column">
                <Grid>
                  {expandButton}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(ObservationSecondary);


