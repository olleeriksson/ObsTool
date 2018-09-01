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
            Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over medium-high
            heat. Add chicken, shrimp and chorizo, and cook, stirring occasionally until lightly
            browned, 6 to 8 minutes. Transfer shrimp to a large plate and set aside, leaving
            chicken and chorizo in the pan. Add pimentón, bay leaves, garlic, tomatoes, onion,
            salt and pepper, and cook, stirring often until thickened and fragrant, about 10
            minutes. Add saffron broth and remaining 4 1/2 cups chicken broth; bring to a boil.
          </Typography>
          <Typography>
            Add rice and stir very gently to distribute. Top with artichokes and peppers, and cook
            without stirring, until most of the liquid is absorbed, 15 to 18 minutes. Reduce heat
            to medium-low, add reserved shrimp and mussels, tucking them down into the rice, and
            cook again without stirring, until mussels have opened and rice is just tender, 5 to 7
            minutes more. (Discard any mussels that don’t open.)
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
