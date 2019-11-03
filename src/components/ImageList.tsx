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
import ResourceDialog from "./ResourceDialog";
import AddIcon from "@material-ui/icons/Add";
import Api from "../api/Api";
import ErrorIcon from "@material-ui/icons/Error";
import CircularProgress from "@material-ui/core/CircularProgress";
import ResourceImage from "./ResourceImage";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import CompareIcon from "@material-ui/icons/Compare";
import ClearIcon from "@material-ui/icons/Clear";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import * as obsResourceCheckActions from "../actions/ObsResourceCheckActions";
import { IAppState, IDataState } from "../types/Types";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";

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
    fontSize: "0.8rem",
    color: "gray", // theme.palette.primary.light,
  },
  titleBarBlack: {
    backgroundColor: "black",
    padding: 0,
    height: 30,
  },
  titleBarWhite: {
    backgroundColor: "white",
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
    height: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    border: "1px solid gray",
    width: 120,
  },
  iconButtonContainer: {  // The container around the checkboxes, clear checkbox button, compare button
    width: 20,
    height: 20,
    color: "lightgray",
  },
  iconButtonIcon: {  // Checkbox, clear checkboxes, compare
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
  store: IDataState;
  actions: any;
  showAddButton: boolean;
}

export interface IImageListState {
  isLoading: boolean;
  isError: boolean;
  isEditResourceDialogOpen: boolean;
  resources?: IObsResource[];
  clickedResource?: IObsResource;
  displayMode?: string;
  checkedResource1?: IObsResource;
  checkedResource2?: IObsResource;
}

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
      clickedResource: undefined,
      displayMode: undefined,
      checkedResource1: undefined,
      checkedResource2: undefined,
    };
  }

  public componentDidUpdate(prevProps: IImageListProps) {
    if (this.props.resources && this.props.resources !== prevProps.resources) {
      this.setState({ resources: this.props.resources });
    }
  }

  private onCheckboxChanged = (obsResourceId: number) => (event: any) => {
    if (event.target.checked) {
      if (this.state.resources) {
        const selectedObsResource = this.state.resources.find(r => r.id === obsResourceId);
        if (selectedObsResource) {
          // Add ObsResource to store
          this.props.actions.checkObsResource(selectedObsResource);
        }
      }
    } else {
      this.props.actions.uncheckObsResource(obsResourceId);
    }
  }

  private onClearCheckboxes = () => {
    this.props.actions.clearCheckedObsResources();
  }

  private onClickCompare = () => {
    if (this.props.store.checkedObsResources.length === 2) {
      // Get the selections from the store
      this.setState({ checkedResource1: this.props.store.checkedObsResources[0] });
      this.setState({ checkedResource2: this.props.store.checkedObsResources[1] });

      this.setState({ isEditResourceDialogOpen: true });
      this.setState({ displayMode: "compare" });
      //this.props.actions.clearCheckedObsResources();
    }
  }

  private onClickCompareTheseTwo = (resource1: IObsResource, resource2: IObsResource) => (event: any) => {
    event.preventDefault();
    // Get the selected resources from the event call
    this.setState({ checkedResource1: resource1 });
    this.setState({ checkedResource2: resource2 });

    this.setState({ isEditResourceDialogOpen: true });
    this.setState({ displayMode: "compare" });
  }

  private handleClickResource = (resourceId?: number) => (event: any) => {
    event.preventDefault();
    if (this.state.resources) {
      const clickedResource = this.state.resources.find(r => r.id === resourceId);
      if (clickedResource) {
        this.setState({ clickedResource: clickedResource });
        this.setState({ isEditResourceDialogOpen: true });
        this.setState({ displayMode: "edit" });
      }
    }
  }

  private onClickAddResource = () => {
    this.setState({ clickedResource: undefined });
    this.setState({ isEditResourceDialogOpen: true });
    this.setState({ displayMode: "edit" });
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
    this.setState({ clickedResource: undefined }); // needed?
    this.setState({ isEditResourceDialogOpen: false });
    this.setState({ displayMode: undefined });
    this.props.actions.clearCheckedObsResources();

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
      && this.state.resources.filter(r => r.type === "sketch" || r.type === "jot" || r.type === "image") || [];

    const links = this.state.resources && this.state.resources.length > 0
      && this.state.resources.filter(r => r.type === "link") || [];

    const imageElements = images.map(r => {
      let clearIcon;
      if (this.props.store.checkedObsResources.length > 0) {
        clearIcon = (
          <IconButton color="secondary" className={classes.iconButtonContainer} onClick={this.onClearCheckboxes}>
            <ClearIcon className={classes.iconButtonIcon} />
          </IconButton>
        );
      }

      let compareIcon;
      const checkedResources = this.props.store.checkedObsResources;
      const thisResourceIsChecked = checkedResources.length === 2 && checkedResources.some(checkedRes => checkedRes.id === r.id);
      if (checkedResources.length === 2 && thisResourceIsChecked) {
        compareIcon = (
          <IconButton color="secondary" className={classes.iconButtonContainer} onClick={this.onClickCompare}>
            <CompareIcon className={classes.iconButtonIcon} />
          </IconButton>
        );
      }

      const checkboxIcon = (
        <Checkbox
          className={classes.iconButtonContainer}
          icon={<CheckBoxOutlineBlankIcon className={classes.iconButtonIcon} />}
          checkedIcon={<CheckBoxIcon className={classes.iconButtonIcon} />}
          checked={this.props.store.checkedObsResources.some(storeRes => storeRes.id === r.id)}
          onChange={this.onCheckboxChanged(r.id || -1)}
        />
      );

      const icons = <div>
        {clearIcon}
        {compareIcon}
        {checkboxIcon}
      </div>;

      const titleBarClass = r.backgroundColor === 255 ? classes.titleBarWhite : classes.titleBarBlack;

      return <GridListTile key={r.id} className={classes.tile}>
        <div onClick={this.handleClickResource(r.id)} className={classes.imageContainer} >
          <ResourceImage
            type={r.type}
            url={r.url}
            name={r.name}
            inverted={r.inverted}
            rotation={r.rotation}
            zoomLevel={r.zoomLevel}
            backgroundColor={r.backgroundColor}
            driveMaxHeight="180"
            driveMaxWidth="180"
          />
        </div>
        <GridListTileBar
          title={r.type}
          classes={{ root: titleBarClass, title: classes.title, titlePositionBottom: classes.titleWrap }}
          actionIcon={icons}
        />
      </GridListTile>;
    });

    const linkElements = links.map(r =>
      <Typography key={r.id} gutterBottom={false} variant="caption">
        <a href={r.url}>{r.name || r.url}</a>&nbsp;
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

    let resourceDialog;
    if (this.state.displayMode === "edit") {
      resourceDialog = (
        <ResourceDialog
          isOpen={this.state.isEditResourceDialogOpen}
          observationId={this.props.observationId}
          resource1={this.state.clickedResource}
          onHandleClose={this.handleEditResourceDialogClosed}
          displayMode="edit"
        />
      );
    } else if (this.state.displayMode === "compare") {
      resourceDialog = (
        <ResourceDialog
          isOpen={this.state.isEditResourceDialogOpen}
          observationId={this.props.observationId}
          resource1={this.state.checkedResource1}
          resource2={this.state.checkedResource2}
          onHandleClose={this.handleEditResourceDialogClosed}
          displayMode="compare"
        />
      );
    }

    let compareTheseTwo;
    if (images.length === 2) {
      compareTheseTwo = (
        <IconButton color="secondary" className={classes.iconButtonContainer} onClick={this.onClickCompareTheseTwo(images[0], images[1])}>
          <CompareIcon className={classes.iconButtonIcon} />
        </IconButton>
      );
    }

    let addButton;
    if (this.props.showAddButton) {
      addButton = (
        <IconButton color="secondary" className={classes.iconButtonContainer} onClick={this.onClickAddResource}>
          <AddIcon className={classes.iconButtonIcon} />
        </IconButton>
      );
    }

    return (
      <div>
        {resourceDialog}

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
          <Typography variant="body1" color="textSecondary">
            {compareTheseTwo}
            {addButton}
          </Typography>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = (state: IAppState) => {
  return {
    store: state.data
  };
};

const mapDispatchToProps = (dispatch: Dispatch<obsResourceCheckActions.ObsResourceCheckAction>) => {
  return {
    actions: bindActionCreators(
      { ...obsResourceCheckActions },
      dispatch
    )
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ImageList));
