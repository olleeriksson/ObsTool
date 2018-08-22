import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
// import EditIcon from "@material-ui/icons/Edit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "./Types";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";

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
});

export interface IObservationProps extends WithStyles<typeof styles> {
  observation: IObservation;
  onSelectObservation: (id: number) => void;
}

export interface IObservationState {
  isLoading: boolean;
  isError: boolean;
  isExpanded: boolean;
}

class Observation extends React.Component<IObservationProps, IObservationState> {
  constructor(props: IObservationProps) {
    super(props);

    this.state = {
      isLoading: true,
      isError: false,
      isExpanded: false,
    };
  }

  public render() {
    const { classes } = this.props;

    return (
      <Paper className={classes.root}>
        <Grid container={true} spacing={16}>
          <Grid item={true}>
            <ButtonBase className={classes.image}>
              <Typography gutterBottom={true} variant="display2">
                <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" />
              </Typography>
            </ButtonBase>
          </Grid>
          <Grid item={true} xs={12} sm={true} container={true}>
            <Grid item={true} xs={true} container={true} direction="column" spacing={16}>
              <Grid item={true} xs={true}>
                <Typography gutterBottom={true} variant="subheading">
                  {this.props.observation.dso.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom={true}>
                  {this.props.observation.dso.type}
                </Typography>
                <Typography >
                  {this.props.observation.text}
                </Typography>
              </Grid>
            </Grid>
            <Grid item={true}>
              <Typography variant="subheading">Edit</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default withStyles(styles)(Observation);
