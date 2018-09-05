import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { IObsResource } from "./Types";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
// import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
// import classNames from "classnames";
import EditIcon from "@material-ui/icons/Edit";
import EditResourceDialog from "./EditResourceDialog";
import AddIcon from "@material-ui/icons/Add";
import Api from "../api/Api";
import ErrorIcon from "@material-ui/icons/Error";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme: Theme) => createStyles({
  root: {
  },
  imageContainer: {

  },
  image: {
    border: 1,
    width: 96,
  },
  addButton: {
    color: "green"
  },
  error: {
    color: "red"
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

export interface IImageListProps extends WithStyles<typeof styles> {
  observationId: number;
  resources?: IObsResource[];
}

export interface IImageListState {
  isLoading: boolean;
  isError: boolean;
  // isExpanded: boolean;
  isEditResourceDialogOpen: boolean;
  resources?: IObsResource[];
  selectedResource?: IObsResource;
}

class ImageList extends React.Component<IImageListProps, IImageListState> {
  constructor(props: IImageListProps) {
    super(props);

    this.state = {
      isLoading: false,
      isError: false,
      // isExpanded: false,
      resources: [...this.props.resources || []],
      isEditResourceDialogOpen: false,
      selectedResource: undefined
    };

    //this.handleClickResource = this.handleClickResource.bind(this);
    // this.handleExpandClick = this.handleExpandClick.bind(this);
  }

  private handleClickResource = (resourceId?: number) => (event: any) => {
    if (this.state.resources) {
      const selectedResource = this.state.resources.find(r => r.id === resourceId);
      if (selectedResource) {
        this.setState({ selectedResource: selectedResource });
        this.setState({ isEditResourceDialogOpen: true });
      }
    }
  }

  private onClickAddResource = () => {
    this.setState({ selectedResource: undefined });
    this.setState({ isEditResourceDialogOpen: true });
  }

  // private handleExpandClick = () => {
  //   this.setState({ isExpanded: !this.state.isExpanded });
  // }

  private refreshResourcesListFromApi = () => {
    Api.getResources(this.props.observationId).then(
      (response) => {
        const { data } = response;
        const updatedResources = data;
        this.setState({
          isLoading: false,
          isError: false,
          resources: updatedResources
        });
      },
      () => this.indicateError()
    );
  }

  private handleEditResourceDialogClosed = (confirm: boolean) => {
    this.setState({ selectedResource: undefined }); // needed?
    this.setState({ isEditResourceDialogOpen: false });

    // If the edit dialog was closed with a positive boolean that indicates that
    // some resource was added, updated, or deleted. Then we need to refresh the list
    // by loading it again from the Api.
    if (confirm) {
      this.refreshResourcesListFromApi();
    }
  }

  private indicateError = () => {
    this.setState({ isLoading: false });
    this.setState({ isError: true });
  }

  public render() {
    const { classes } = this.props;

    let error;
    if (this.state.isError) {
      error = (
        <div className={classes.error}>
          <ErrorIcon color="error" /> Something went wrong!
            </div>
      );
    }

    let circularProgress;
    if (this.state.isLoading) {
      circularProgress = (
        <div className="circularProgressContainer">
          <CircularProgress className="circularProgress" />
        </div>
      );
    }

    // let expandButton;
    // if (this.state.resources && this.state.resources.length > 0) {
    //   expandButton = (
    //     <IconButton
    //       className={classNames(classes.expand, { [classes.expandOpen]: this.state.isExpanded })}
    //       onClick={this.handleExpandClick}
    //       aria-expanded={this.state.isExpanded}
    //       aria-label="Show more"
    //     >
    //       <ExpandMoreIcon />
    //     </IconButton>
    //   );
    // }

    const images = this.state.resources && this.state.resources.length > 0
      && this.state.resources.filter(r => r.type === "sketch" || r.type === "image") || [];

    const links = this.state.resources && this.state.resources.length > 0
      && this.state.resources.filter(r => r.type === "link") || [];

    // <IconButton
    //   onClick={this.handleClickResource(r.id)}
    // >
    //   <EditIcon />
    // </IconButton>

    // let expandedGridItem;
    // if (this.state.isExpanded) {
    //   expandedGridItem = (
    //     <Grid item={true}>
    //       <Typography gutterBottom={true} variant="subheading">
    //         Something more...
    //       </Typography>
    //     </Grid>
    //   );
    // }

    // <Grid item={true}>
    //   {expandButton}
    // </Grid>
    // {expandedGridItem}

    const imageElements = [];
    console.log(images);
    imageElements.push(images.map(r =>
      <Grid key={r.id} item={true}>
        <div className={classes.imageContainer} onClick={this.handleClickResource(r.id)}>
          <img src={r.url} title={r.name} className={classes.image} />
        </div>
      </Grid>
    ));

    const linkElements = [];
    linkElements.push(links.map(r =>
      <Typography key={r.id} gutterBottom={true} variant="subheading">
        <a href={r.url}>{r.name}</a>
        <IconButton
          onClick={this.handleClickResource(r.id)}
        >
          <EditIcon />
        </IconButton>
      </Typography>
    ));

    const imagesTitle = imageElements.length > 0 && (
      <Grid item={true}>
        <Typography variant="caption">
          Sketches &amp; Images
        </Typography>
      </Grid>
    );

    const linksTitle = linkElements.length > 0 && (
      <Typography variant="caption">
        Links
      </Typography>
    );

    return (
      <div>
        <EditResourceDialog
          isOpen={this.state.isEditResourceDialogOpen}
          observationId={this.props.observationId}
          resource={this.state.selectedResource}
          onHandleClose={this.handleEditResourceDialogClosed}
        />
        <Grid container={true} spacing={8} direction="column">
          {imagesTitle}
          <Grid item={true}>
            <Grid container={true} spacing={24} direction="row" alignItems="center">
              {imageElements}
            </Grid>
          </Grid>
          {linksTitle}
          <Grid item={true}>
            {linkElements}
          </Grid>
          <Grid item={true}>
            {error}
            {circularProgress}
            <IconButton color="primary" className={classes.addButton} component="span" onClick={this.onClickAddResource}>
              <AddIcon />
            </IconButton>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(ImageList);
