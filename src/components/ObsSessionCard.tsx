import * as React from "react";
//import "./ObsSessionCard.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import IconButton from "@material-ui/core/IconButton";
import VisibilityIcon from "@material-ui/icons/Visibility";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObsSession } from "../types/Types";

const styles = (theme: Theme) => createStyles({
  paper: {
    margin: theme.spacing.unit * 1,
    padding: theme.spacing.unit * 1,
  },
  mainRowItem: {
    flexGrow: 1,
  },
  mainRowContainer: {
    flexGrow: 1,
    maxWidth: "100%",
    padding: theme.spacing.unit * 1,
  },
  icon: {
    padding: theme.spacing.unit * 1,
  },
  header: {
    flexGrow: 1,
    maxHeight: 100,
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  buttons: {
  },
  summary: {
    padding: theme.spacing.unit * 1,
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

// children?: React.ReactNode;

export interface IObsSessionCardProps extends WithStyles<typeof styles> {
  obsSession: IObsSession;
  onSelectObsSessionCard: (obsSessionId: number) => void;
}

interface IObsSessionCardState {
  isExpanded: boolean;
}

class ObsSessionCard extends React.Component<IObsSessionCardProps, IObsSessionCardState> {
  constructor(props: IObsSessionCardProps) {
    super(props);

    this.state = {
      isExpanded: false
    };

    // this.handleExpandClick = this.handleExpandClick.bind(this);
    this.handleClickOnObsSession = this.handleClickOnObsSession.bind(this);
  }

  private handleExpandClick = () => {
    this.setState(state => ({ isExpanded: !state.isExpanded }));
  }

  public handleClickOnObsSession() {
    if (this.props.obsSession.id) {
      this.props.onSelectObsSessionCard(this.props.obsSession.id);
    }
  }

  public render() {
    const { classes } = this.props;

    let expandedGridItem;
    if (this.state.isExpanded) {
      expandedGridItem = (
        <Grid item={true}>
          <Typography variant="body1">
            <strong>Summary:</strong>
          </Typography>
          <Typography variant="body1">
            {this.props.obsSession.summary && this.props.obsSession.summary.toString()}
          </Typography>
          <Typography variant="body1">
            <strong>Conditions:</strong>
          </Typography>
          <Typography variant="body1">
            {this.props.obsSession.conditions && this.props.obsSession.conditions.toString() || <span>N/A</span>}
          </Typography>
          <Typography variant="body1">
            <strong>Seeing:</strong>
            {this.props.obsSession.seeing && this.props.obsSession.seeing.toString() || <span>N/A</span>}
          </Typography>
          <Typography variant="body1">
            <strong>Transparency:</strong>
            {this.props.obsSession.transparency && this.props.obsSession.transparency.toString() || <span>N/A</span>}
          </Typography>
          <Typography variant="body1">
            <strong>Limiting magnitude:</strong>
            {this.props.obsSession.limitingMagnitude && this.props.obsSession.limitingMagnitude.toString() || <span>N/A</span>}
          </Typography>
        </Grid>
      );
    }

    const dateLocationSeparator = this.props.obsSession.date &&
      this.props.obsSession.location && this.props.obsSession.location.name && " - ";

    return (
      <Paper className={classes.paper}>
        <Grid container={true} spacing={8}>
          <Grid item={true} xs={12} className={classes.mainRowItem}>
            <Grid container={true} spacing={8} className={classes.mainRowContainer}>
              <Grid item={true}>
                <div className={classes.icon}>
                  <Typography gutterBottom={true} variant="display1">
                    <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />
                  </Typography>
                </div>
              </Grid>
              <Grid item={true} xs={12} sm={true} className={classes.header}>
                <Grid container={true} direction="column" spacing={8}>
                  <Grid item={true} xs={true}>
                    <Typography variant="subheading">
                      {this.props.obsSession.title && this.props.obsSession.title.toString()}
                    </Typography>
                    <Typography variant="caption">
                      {this.props.obsSession.date && this.props.obsSession.date.toString()}
                      {dateLocationSeparator}
                      {this.props.obsSession.location && this.props.obsSession.location.name}
                    </Typography>
                  </Grid>
                  <Grid item={true} xs={true} className={classes.summary}>
                    <Typography variant="caption">
                      {this.props.obsSession.summary && this.props.obsSession.summary.toString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item={true} className={classes.buttons}>
                <Grid container={true} direction="column" spacing={0}>
                  <Grid item={true}>
                    <IconButton
                      onClick={this.handleClickOnObsSession}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Grid>
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
      </Paper>
    );
  }
}

export default withStyles(styles)(ObsSessionCard);
