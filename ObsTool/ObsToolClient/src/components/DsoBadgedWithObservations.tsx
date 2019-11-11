import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
// import Grid from "@material-ui/core/Grid";
import { IDso } from "../types/Types";
import DsoExtra from "./DsoExtra";
import DsoRegular from "./DsoRegular";
import Badge from "@material-ui/core/Badge";
// import ObservationSecondary from "./ObservationSecondary";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import classNames from "classnames";
import ObservationSecondary from "./ObservationSecondary";
import Typography from "@material-ui/core/Typography";
import DsoAnnotations from "./DsoAnnotations";

const styles = (theme: Theme) => createStyles({
  root: {
    top: 20,
    right: -15,
  },
  badge: {
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

interface IDsoBadgedWithObservationsProps extends WithStyles<typeof styles> {
  dso: IDso;
  showBadge: boolean;
  showObservations: boolean;
  startWithObservationsExpanded: boolean;
}

interface IDynamicDsoLabelState {
  isExpanded: boolean;
}

class DsoBadgedWithObservations extends React.Component<IDsoBadgedWithObservationsProps, IDynamicDsoLabelState> {
  constructor(props: IDsoBadgedWithObservationsProps) {
    super(props);

    this.state = {
      isExpanded: this.props.startWithObservationsExpanded
    };
  }

  private handleExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  public render() {
    const { classes } = this.props;

    let expandButton;
    if (this.props.showObservations && this.props.dso.observations && this.props.dso.observations.length > 0) {
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

    // Create the DsoLabel with or without a badge
    let dsoLabel;
    if (this.props.showBadge && this.props.dso.numObservations && this.props.dso.numObservations > 0) {
      dsoLabel = (
        <Grid container={true}>
          <Grid item={true} xs={11}>
            <Badge className={classes.badge} badgeContent={this.props.dso.numObservations} color="secondary">
              <DsoRegular dso={this.props.dso} />
            </Badge>
            <span style={{ marginLeft: "1.2em" }} >
              <DsoAnnotations
                rating={this.props.dso.dsoExtra && this.props.dso.dsoExtra.rating}
                followUp={this.props.dso.dsoExtra && this.props.dso.dsoExtra.followUp}
              />
            </span>

            <div style={{ marginLeft: 8 }} >
              <DsoExtra dso={this.props.dso} />
            </div>
          </Grid>
          <Grid item={true} xs={1}>
            {expandButton}
          </Grid>
        </Grid>
      );
    } else {
      dsoLabel = (
        <div>
          <DsoRegular dso={this.props.dso} />
          {expandButton}
        </div>
      );
    }

    let observationsSection;
    if (this.state.isExpanded) {

      let observations;
      if (this.props.dso.observations) {
        observations = this.props.dso.observations.map(obs =>
          <ObservationSecondary key={obs.id} observation={obs} />
        );
      }

      observationsSection = (
        <div>
          <Typography gutterBottom={true} variant="subtitle1">
            <strong>Observations</strong>
          </Typography>
          {observations}
        </div>
      );
    }

    // let observations;
    // if (this.props.showObservations) {
    //   const observationItems = this.props.dso.observations && this.props.dso.observations.map(obs => {
    //     return (
    //       <Grid key={obs.id} item={true} xs={12}>
    //         <ObservationSecondary observation={obs} />
    //       </Grid>
    //     );
    //   });
    //   observations = (
    //     <Grid container={true} spacing={1} direction="column">
    //       {observationItems}
    //     </Grid>
    //   );
    // }

    return (
      <div>
        {dsoLabel}
        {observationsSection}
      </div>
    );
  }
}

export default withStyles(styles)(DsoBadgedWithObservations);
