/*
 * Component for an observation, when it's listed under a DSO component, so not listed on its own.
 */
import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "../types/Types";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classNames from "classnames";
import ImageList from "./ImageList";

const styles = (theme: Theme) => createStyles({
  root: {
    border: "1px dashed lightgray",
    margin: "0.5em",
    padding: "0.3em"
    //padding: theme.spacing(1),
  },
  image: {
    border: 1,
    width: 48,
    height: 48,
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

export interface IObservationSecondaryProps extends WithStyles<typeof styles> {
  observation: IObservation;
}

export interface IObservationSecondaryState {
  isExpanded: boolean;
}

class ObservationSecondary extends React.Component<IObservationSecondaryProps, IObservationSecondaryState> {
  constructor(props: IObservationSecondaryProps) {
    super(props);

    this.state = {
      isExpanded: true,
    };

    this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
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

    let imageListTeaser;
    if (this.props.observation.obsResources && this.props.observation.obsResources.length > 0 && !this.state.isExpanded) {
      imageListTeaser = (
        <Typography variant="caption" onClick={this.handleExpandClick} style={{ cursor: "pointer" }} >
          ({this.props.observation.obsResources.length} resource{this.props.observation.obsResources.length > 1 && "s"}..)
        </Typography>
      );
    }

    let expandedGridItem;
    if (this.state.isExpanded) {
      expandedGridItem = (
        <Grid item={true} xs={12}>
          <ImageList observationId={this.props.observation.id} resources={this.props.observation.obsResources} showAddButton={false} />
        </Grid>
      );
    }

    const obsSessionId = this.props.observation.obsSession && this.props.observation.obsSession.id;
    const obsSessionUrl = "/session/" + obsSessionId;
    const obsSessionDate = this.props.observation.obsSession && this.props.observation.obsSession.date;
    const obsSessionTitle = this.props.observation.obsSession && this.props.observation.obsSession.title && this.props.observation.obsSession.title;
    const obsSessionLocation = this.props.observation.obsSession && this.props.observation.obsSession.location && "(" + this.props.observation.obsSession.location.name + ")";
    const observationIcon = this.props.observation.nonDetection ? "eye-slash" : "binoculars";

    return (
      <Grid container={true} spacing={0} direction="column" className={classes.root}>
        <Grid item={true} xs={12}>
          <Grid container={true} spacing={0} direction="row">
            <Grid item={true}>
              <ButtonBase className={classes.image}>
                <Typography gutterBottom={false} variant="h6">
                  <FontAwesomeIcon icon={observationIcon} className="faSpaceAfter" />
                </Typography>
              </ButtonBase>
            </Grid>
            <Grid item={true} xs={12} sm={true}>
              <Grid container={true} direction="column" spacing={2}>
                <Grid item={true} xs={true}>
                  <Typography variant="body2">
                    <a href={obsSessionUrl}>
                      {obsSessionDate} &nbsp;
                      {obsSessionTitle} &nbsp;
                      {obsSessionLocation}
                    </a>
                  </Typography>
                  <Typography variant="body2">
                    {this.props.observation.text}
                  </Typography>
                  {imageListTeaser}
                </Grid>
                {expandedGridItem}
              </Grid>
            </Grid>
            <Grid item={true}>
              <Grid container={true} direction="column">
                <Grid item={true}>
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
