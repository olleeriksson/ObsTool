import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "./Types";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classNames from "classnames";
import DsoExtended from "./DsoExtended";
import ObservationSecondary from "./ObservationSecondary";

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
    maxWidth: "100 %",
    padding: theme.spacing.unit * 1,
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
          <Typography gutterBottom={true} variant="subheading">
            <strong>Other (earlier) observations</strong>
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

    return (
      <Paper className={classes.root}>
        <Grid container={true} spacing={16} direction="column">
          <Grid item={true} xs={12}>
            <Grid container={true} spacing={16}>
              <Grid item={true}>
                <ButtonBase className={classes.image}>
                  <Typography gutterBottom={true} variant="display2">
                    <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" />
                  </Typography>
                </ButtonBase>
              </Grid>
              <Grid item={true} xs={12} sm={true}>
                <Grid container={true} direction="column" spacing={16}>
                  <Grid item={true} xs={true}>
                    <DsoExtended dso={this.props.observation.dso} />
                    <Typography >
                      {this.props.observation.text}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item={true}>
                <Grid container={true} direction="column">
                  <Grid item={true}>
                    <IconButton onClick={this.handleClickOnObservation} >
                      <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />
                    </IconButton>
                  </Grid>
                  <Grid item={true}>
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
