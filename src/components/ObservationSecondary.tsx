import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "./Types";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classNames from "classnames";

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
    maxWidth: "100 %",
    padding: theme.spacing.unit * 1,
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
      isExpanded: false,
    };

    this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  public render() {
    const { classes } = this.props;

    let expandedGridItem;
    if (this.state.isExpanded) {
      expandedGridItem = (
        <Grid item={true} xs={12}>
          <Typography>
            (...Not sure what to expose here.. maybe photos and sketches..)
          </Typography>
          <Typography>
            Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum
            Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum
          </Typography>
        </Grid>
      );
    }

    return (
      <Grid container={true} spacing={16} direction="column">
        <Grid item={true} xs={12}>
          <Grid container={true} spacing={16} direction="row">
            <Grid item={true}>
              <ButtonBase className={classes.image}>
                <Typography gutterBottom={false} variant="title">
                  <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" />
                </Typography>
              </ButtonBase>
            </Grid>
            <Grid item={true} xs={12} sm={true}>
              <Grid container={true} direction="column" spacing={16}>
                <Grid item={true} xs={true}>
                  <Typography >
                    {this.props.observation.obsSession && this.props.observation.obsSession.date}
                    {this.props.observation.obsSession && this.props.observation.obsSession.location && this.props.observation.obsSession.location.name}
                  </Typography>
                  <Typography >
                    {this.props.observation.text}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item={true}>
              <Grid container={true} direction="column">
                <Grid item={true}>
                  <IconButton
                    className={classNames(classes.expand, { [classes.expandOpen]: this.state.isExpanded })}
                    onClick={this.handleExpandClick}
                    aria-expanded={this.state.isExpanded}
                    aria-label="Show more"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {expandedGridItem}
      </Grid>
    );
  }
}

export default withStyles(styles)(ObservationSecondary);
