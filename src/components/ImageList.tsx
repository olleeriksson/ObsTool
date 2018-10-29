import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { IObsResource } from "../types/Types";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
// import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
// import classNames from "classnames";
import EditIcon from "@material-ui/icons/Edit";
import EditResourceDialog from "./EditResourceDialog";
import AddIcon from "@material-ui/icons/Add";
import Api from "../api/Api";
import ErrorIcon from "@material-ui/icons/Error";
import CircularProgress from "@material-ui/core/CircularProgress";
import ResourceImage from "./ResourceImage";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import Checkbox from "@material-ui/core/Checkbox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

const styles = (theme: Theme) => createStyles({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: "red"
  },
  gridList: {
    flexWrap: "wrap",
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: "translateZ(0)",
  },
  title: {
    fontSize: "0.9rem",
    color: "gray", // theme.palette.primary.light,
  },
  titleBar: {
    background: "rgba(0, 0, 0, 0)",
    padding: 0,
    height: 30,
  },
  titleWrap: {
    marginLeft: -8,
  },
  tile: {
    backgroundColor: "black",
    margin: 3,
  },
  imageContainer: {
  },
  image: {
    border: "1px solid gray",
    width: 120,
  },
  cb: {  // checkbox
    width: 30,
    height: 30,
  },
  cbIcon: {  // checkbox
    fontSize: 20,
    color: "lightgray",
  },
  addButton: {
    color: "green"
  },
  error: {
    color: "red"
  },
});

export interface IImageListProps extends WithStyles<typeof styles> {
  observationId: number;
  resources?: IObsResource[];
}

export interface IImageListState {
  isLoading: boolean;
  isError: boolean;
  isEditResourceDialogOpen: boolean;
  resources?: IObsResource[];
  selectedResource?: IObsResource;
}

// --------------------

const cbStyles = (theme: Theme) => createStyles({
  cb: {  // checkbox
    width: 40,
    height: 40,
  },
  cbIcon: {  // checkbox
    fontSize: 20,
  },
});

interface IImageCheckBoxProps extends WithStyles<typeof cbStyles> {
  resourceId: number;
  onSelected?: (resourceId: number) => void;
}

const ImageCheckBox: React.SFC<IImageCheckBoxProps> = (props: IImageCheckBoxProps) => {
  const { classes } = props;

  return <Checkbox
    className={classes.cb}
    icon={<CheckBoxOutlineBlankIcon className={classes.cbIcon} />}
    checkedIcon={<CheckBoxIcon className={classes.cbIcon} />}
    value="checked"
  />;
};

// --------------------

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
  }

  private handleClickResource = (resourceId?: number) => (event: any) => {
    event.preventDefault();
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

    const images = this.state.resources && this.state.resources.length > 0
      && this.state.resources.filter(r => r.type === "sketch" || r.type === "image") || [];

    const links = this.state.resources && this.state.resources.length > 0
      && this.state.resources.filter(r => r.type === "link") || [];

    const imageElements = images.map(r => (
      <GridListTile key={r.id} className={classes.tile}>
        <div onClick={this.handleClickResource(r.id)} className={classes.imageContainer} >
          <ResourceImage type={r.type} url={r.url} name={r.name} driveMaxHeight="180" driveMaxWidth="180" />
        </div>
        <GridListTileBar
          title={r.type}
          classes={{ root: classes.titleBar, title: classes.title, titlePositionBottom: classes.titleWrap }}
          actionIcon={<ImageCheckBox resourceId={r.id || 0} classes={{ cb: classes.cb, cbIcon: classes.cbIcon }} />}
        />
      </GridListTile>
    ));

    const linkElements = links.map(r =>
      <Typography key={r.id} gutterBottom={false} variant="caption">
        <a href={r.url}>{r.name}</a>&nbsp;
        <a href="" onClick={this.handleClickResource(r.id)}>
          <EditIcon style={{ fontSize: 14 }} />
        </a>
      </Typography>
    );

    const imagesTitle = imageElements.length > 0 && (
      <Grid item={true}>
        <Typography variant="caption">
          <strong>Sketches &amp; Images</strong> &nbsp;
        </Typography>
      </Grid>
    );

    const linksTitle = linkElements.length > 0 && (
      <Typography variant="caption">
        <strong>Links</strong> &nbsp;
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
          <GridList className={classes.gridList} cols={3.5}>
            {imageElements}
          </GridList>
          {linksTitle}
          <Grid item={true}>
            {linkElements}
          </Grid>
          {error}
          {circularProgress}
          <Typography variant="caption" color="textSecondary">
            <span onClick={this.onClickAddResource}><AddIcon style={{ fontSize: 14 }} /></span>
          </Typography>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(ImageList);
