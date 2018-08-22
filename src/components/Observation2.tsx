import * as React from "react";
import "./Observation.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import red from "@material-ui/core/colors/red";
// import EditIcon from "@material-ui/icons/Edit";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IObservation } from "./Types";

const styles = (theme: Theme) => createStyles({
  card: {
    maxWidth: 400,
    margin: "10px",
  },
  media: {
    height: 0,
  },
  actions: {
    display: "flex",
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
  avatar: {
    backgroundColor: red[500],
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
      <Card className={classes.card}>
        <CardHeader
          avatar={<FontAwesomeIcon icon="binoculars" className="faSpaceAfter" />}
          action={<IconButton><MoreVertIcon /></IconButton>}
          title={this.props.observation.dso.name}
          subheader={this.props.observation.dso.type}
        />
        <CardMedia
          className={classes.media}
          image="/static/images/cards/paella.jpg"
          title="Contemplative Reptile"
        />
        <CardContent>
          <Typography component="p">
            {this.props.observation.text}
          </Typography>
        </CardContent>
      </Card>
    );
  }
}

export default withStyles(styles)(Observation);
