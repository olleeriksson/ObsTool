import * as React from "react";
import "./ObsSessionPreview.css";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import red from "@material-ui/core/colors/red";
import FavoriteIcon from "@material-ui/icons/Favorite";
import ShareIcon from "@material-ui/icons/Share";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

// children?: React.ReactNode;

export interface IObsSessionPreviewProps extends WithStyles<typeof styles> {
  id: number;
  title: string;
  date: string;
  summary: string;
  onSelectObsSessionPreview: (obsSessionId: number) => void;
}

interface IObsSessionPreviewState {
  expanded: boolean;
}

class ObsSessionPreview extends React.Component<IObsSessionPreviewProps, IObsSessionPreviewState> {
  constructor(props: IObsSessionPreviewProps) {
    super(props);

    this.state = {
      expanded: false
    };

    // this.onClick = this.onClick.bind(this);
  }

  private handleExpandClick = () => {
    this.setState(state => ({ expanded: !state.expanded }));
  }

  // public onClick() {
  //   console.log("Clicked on the div");
  //   this.props.onSelectObsSessionPreview(this.props.id);
  // }

  // public render() {
  //   const { classes } = this.props;
  //   return (
  //     <div className="obsSessionPreview" onClick={this.onClick}>
  //       <div><strong>{this.props.title}</strong></div>
  //       <div><strong>Date:</strong> {this.props.date}</div>
  //       <div><strong>Summary:</strong> {this.props.summary}</div>
  //     </div>
  //   );
  // }

  public render() {
    const { classes } = this.props;

    return (
      <Card className={classes.card}>
        <CardHeader
          avatar={<FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />}
          action={<IconButton><MoreVertIcon /></IconButton>}
          title={this.props.title}
          subheader={this.props.date}
        />
        <CardMedia
          className={classes.media}
          image="/static/images/cards/paella.jpg"
          title="Contemplative Reptile"
        />
        <CardContent>
          <Typography component="p">
            {this.props.summary}
          </Typography>
        </CardContent>
        <CardActions className={classes.actions} disableActionSpacing={true}>
          <IconButton aria-label="Add to favorites">
            <FavoriteIcon />
          </IconButton>
          <IconButton aria-label="Share">
            <ShareIcon />
          </IconButton>
          <IconButton
            className={classNames(classes.expand, { [classes.expandOpen]: this.state.expanded })}
            onClick={this.handleExpandClick}
            aria-expanded={this.state.expanded}
            aria-label="Show more"
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
        <Collapse in={this.state.expanded} timeout="auto" unmountOnExit={true}>
          <CardContent>
            <Typography variant="body2">
              Method:
            </Typography>
            <Typography>
              Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10
              minutes.
            </Typography>
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
            <Typography>
              Set aside off of the heat to let rest for 10 minutes, and then serve.
            </Typography>
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default withStyles(styles)(ObsSessionPreview);
