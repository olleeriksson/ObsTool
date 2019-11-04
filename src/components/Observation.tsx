/*
 * Component for an observation, when it's listed on its own, which means it also has to say what DSO it belongs to.
 */
import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "../types/Types";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classNames from "classnames";
import DsoExtended from "./DsoExtended";
import ObservationSecondary from "./ObservationSecondary";
import ImageList from "./ImageList";

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
    maxWidth: "100 %",
    padding: theme.spacing(1),
  },
  image: {
    border: 1,
    width: 96,
    height: 96,
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
});

export interface IObservationProps extends WithStyles<typeof styles> {
  observation: IObservation;
  onSelectObservation: (id: number) => void;
}

export interface IObservationState {
  isExpanded: boolean;
}

class Observation extends React.Component<IObservationProps, IObservationState> {
  constructor(props: IObservationProps) {
    super(props);

    this.state = {
      isExpanded: false,
    };

    this.handleClickOnObservation = this.handleClickOnObservation.bind(this);
    this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleClickOnObservation = () => {
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  public render() {
    const { classes } = this.props;

    let expandedGridItem;
    if (this.state.isExpanded) {

      let otherObservations;
      if (this.props.observation.otherObservations) {
        otherObservations = this.props.observation.otherObservations.map(otherObs =>
          <ObservationSecondary key={otherObs.id} observation={otherObs} />
        );
      }

      expandedGridItem = (
        <Grid item={true} xs={12}>
          <Typography gutterBottom={true} variant="subtitle1">
            <strong>Other observations</strong>
          </Typography>
          {otherObservations}
        </Grid>
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
      dsoObjects = this.props.observation.dsoObservations.map(o =>
        <DsoExtended key={o.dso.id} dso={o.dso} customObjectName={o.customObjectName} />
      );
    }

    const observationIcon = this.props.observation.nonDetection ? "eye-slash" : "binoculars";

    return (
      <Paper className={classes.root}>
        <Grid container={true} spacing={2} direction="column">
          <Grid item={true} xs={12}>
            <Grid container={true} spacing={2} wrap="nowrap">
              <Grid item={true}>
                <ButtonBase className={classes.image}>
                  <Typography gutterBottom={true} variant="h3">
                    <FontAwesomeIcon icon={observationIcon} className="faSpaceAfter" />
                  </Typography>
                </ButtonBase>
              </Grid>
              <Grid item={true} xs={11} sm={true}>
                <Grid container={true} direction="column" spacing={2}>
                  <Grid item={true} xs={true}>
                    {dsoObjects}
                    <div style={{ marginTop: "1em", marginBottom: "1em" }}>
                      <Typography variant="body2" gutterBottom={true}>
                        {this.props.observation.text}
                      </Typography>
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <ImageList observationId={this.props.observation.id} resources={this.props.observation.obsResources} showAddButton={true} />
                    </div>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item={true}>
                <Grid container={true} direction="column" style={{ flexGrow: 1 }}>
                  <Grid item={true} style={{ flexGrow: 1 }}>
                    <IconButton onClick={this.handleClickOnObservation} >
                      <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />
                    </IconButton>
                  </Grid>
                  <Grid item={true} style={{ flexGrow: 0 }}>
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
