import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import { IObsResource } from "../types/Types";
import TextField from "@material-ui/core/TextField";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Api from "../api/Api";
import DeleteIcon from "@material-ui/icons/Delete";
import CheckIcon from "@material-ui/icons/Check";
import ErrorIcon from "@material-ui/icons/Error";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import DeleteDialog from "./DeleteDialog";
import Grid from "@material-ui/core/Grid";
import ResourceImage from "./ResourceImage";
import Slider from "@material-ui/lab/Slider";
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    imageContainer: {
        //border: "2px dashed lightgray",
        padding: 5,
        minWidth: 550,
        minHeight: 550,
        maxWidth: 550,
        maxHeight: 550,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    formControl: {
        margin: theme.spacing.unit,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
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
    sliderContainer: {
        width: 150
    },
    slider: {
        padding: "22px 0px",
    },
    circularProgress: {
    },
    circularProgressContainer: {
    },
    saveSuccess: {
        color: "green",
        margin: "5px 20px"
    }
});

interface IResourceViewProps extends WithStyles<typeof styles> {
    observationId: number;  // used when opening the dialog to create a new resource
    resource?: IObsResource;
    displayMode?: string;
    onHandleClose: (confirm: boolean) => void;
}

interface IResourceViewState {
    saveSuccess?: boolean;
    isLoading: boolean;
    isError: boolean;
    displayMode: string;
    isConfirmDeleteDialogOpen: boolean;
    type: string;
    name?: string;
    url?: string;
    rotation: number;
    inverted: boolean;
    backgroundColor: number;
}

class ResourceView extends React.Component<IResourceViewProps, IResourceViewState> {
    constructor(props: IResourceViewProps) {
        super(props);

        this.state = {
            saveSuccess: undefined,
            isLoading: false,
            isError: false,
            displayMode: this.props.displayMode || "left",
            isConfirmDeleteDialogOpen: false,
            type: "image",
            name: "",
            url: "",
            inverted: false,
            rotation: 0,
            backgroundColor: 0
        };
    }

    public componentDidMount() {
        if (this.props.resource) {
            this.setState({
                type: this.props.resource.type,
                name: (this.props.resource.name || undefined),
                url: (this.props.resource.url || undefined),
                inverted: this.props.resource.inverted,
                rotation: this.props.resource.rotation,
                backgroundColor: this.props.resource.backgroundColor
            });
        }
    }

    // public componentWillReceiveProps(nextProps: IResourceViewProps) {
    //     if (!nextProps.resource) {
    //         this.setState({
    //             isLoading: false,
    //             isError: false,
    //             isConfirmDeleteDialogOpen: false,
    //             type: "image",
    //             name: "",
    //             url: "",
    //             inverted: false,
    //             rotation: 0,
    //             backgroundColor: 0
    //         });
    //     }
    //     if (nextProps.resource && this.props.resource !== nextProps.resource) {
    //         // Load from new object
    //         this.setState({
    //             type: nextProps.resource.type,
    //             name: (nextProps.resource.name || undefined),
    //             url: (nextProps.resource.url || undefined),
    //             inverted: nextProps.resource.inverted,
    //             rotation: nextProps.resource.rotation,
    //             backgroundColor: nextProps.resource.backgroundColor
    //         });
    //     }
    // }

    private matchGoogleDriveUrl = (value: string) => {
        // Matches links like https://drive.google.com/open?id=1nze1eHCrwMMKVV6_ZR5iCRsV_FvhYFMw
        if (value.startsWith("https://drive.google.com")) {
            const regexp = /https:\/\/drive\.google\.com\/open\?id=(.*)/g;
            const match = regexp.exec(value);
            if (match) {
                return match[1];
            }

            // Matches links like https://drive.google.com/file/d/1nze1eHCrwMMKVV6_ZR5iCRsV_FvhYFMw/view?usp=sharing
            const regexp2 = /https:\/\/drive\.google\.com\/file\/d\/(.*)\/view.*/g;
            const match2 = regexp2.exec(value);
            if (match2) {
                return match2[1];
            }
        }
        return undefined;
    }

    private handleChange = (name: string) => (event: any) => {
        let newValue = event.target.value;

        if (name === "url") {
            const googleDriveUrl = this.matchGoogleDriveUrl(newValue);
            if (googleDriveUrl) {
                newValue = this.matchGoogleDriveUrl(newValue) || newValue;

                this.setState((prevState, props) => ({
                    ...prevState,
                    type: "sketch",
                    backgroundColor: 255
                }));
            }
        }

        this.setState((prevState, props) => ({
            ...prevState,
            [name]: newValue
        }));
    }

    private handleInvertedCheckboxChange = (event: any, checked: boolean) => {
        this.setState({ inverted: checked });
    }

    private handleBackgroundCheckboxChange = (event: any, checked: boolean) => {
        const color = (checked ? 255 : 0);
        this.setState({ backgroundColor: color });
    }

    private handleSliderChange = (event: any, value: number) => {
        this.setState({ rotation: value * 3.6 });
    }

    private saveResource = () => {
        this.setState({ isLoading: true });
        this.setState({ isError: false });
        this.setState({ saveSuccess: undefined });

        const newResource = {
            id: this.props.resource && this.props.resource.id,
            type: this.state.type,
            name: this.state.name,
            url: this.state.url,
            inverted: this.state.inverted,
            rotation: Math.round(this.state.rotation),
            backgroundColor: this.state.backgroundColor
        };

        if (!this.props.resource || !this.props.resource.id) {
            Api.addResource(this.props.observationId, newResource).then(
                () => {
                    this.setState({ isLoading: false });
                    this.setState({ isError: false });
                    this.props.onHandleClose(true);
                },
                () => this.indicateError()
            );
        } else {
            Api.updateResource(newResource).then(
                () => {
                    this.setState({ isLoading: false });
                    this.setState({ isError: false });
                    this.setState({ saveSuccess: true });
                    this.props.onHandleClose(true);
                },
                () => this.indicateError()
            );
        }
    }

    // When clicking delete
    private onClickDelete = () => {
        if (this.props.resource && this.props.resource.id) {
            this.setState({ isConfirmDeleteDialogOpen: true });
        }
    }

    // When the user has closed the confirm delete dialog
    private handleConfirmDeleteDialogClosed = (confirm: boolean) => {
        this.setState({ isConfirmDeleteDialogOpen: false });
        if (confirm) {
            this.deleteResource();
        }
    }

    // Separate function for actual deleting
    private deleteResource = () => {
        if (this.props.resource && this.props.resource.id) {
            Api.deleteResource(this.props.resource.id).then(
                () => this.props.onHandleClose(true),  // only close this dialog if successfully deleted the resource
                () => this.indicateError()
            );
        }
    }

    private indicateError = () => {
        this.setState({ isLoading: false });
        this.setState({ isError: true });
        this.setState({ saveSuccess: false });
    }

    private handleCloseConfirm = () => {
        this.saveResource();
    }

    // private onBrowseFileSelected = (e: any) => {
    //     console.log(e.target.files[0]);
    //     if (e.target.files && e.target.files[0] && e.target.files[0].name) {
    //         const fileUrl = e.target.files[0].name;
    //         console.log(fileUrl);
    //         var temporaryOutput = document.getElementById("temporaryOutput");
    //         if (temporaryOutput) {
    //             temporaryOutput.src = URL.createObjectURL(e.target.files[0]);
    //         }
    //         this.setState({ url: fileUrl });
    //     }
    // }

    public render() {
        const { classes } = this.props;

        let error;
        if (this.state.isError) {
            error = (
                <span className={classes.error}>
                    <ErrorIcon color="error" /> Something went wrong!
                </span>
            );
        }

        let circularProgress;
        if (this.state.isLoading) {
            circularProgress = (
                <span className={classes.circularProgressContainer}>
                    <CircularProgress className="circularProgress" />
                </span>
            );
        }

        let saveSuccess;
        if (this.state.saveSuccess) {
            saveSuccess = (
                <span className={classes.saveSuccess}>
                    <CheckIcon /> Changes saved!
                </span>
            );
        }

        // let browseFileControl;
        // if (this.state.type === "sketch") {
        //     browseFileControl = (
        //         <Button
        //             component="label"
        //             color="primary"
        //         >
        //             {"Browse to file..."}
        //             <img id="temporaryOutput" style={{ display: "none" }}/>
        //             <input
        //                 onChange={this.onBrowseFileSelected}
        //                 style={{ display: "none" }}
        //                 type="file"
        //             />
        //         </Button>
        //     );
        // }

        const deleteDialogTitle = "Delete " + (this.props.resource && this.props.resource.type) + "?";
        const deleteDialogText = "Are you sure you want to delete the " + (this.props.resource && this.props.resource.type) +
            " " + (this.props.resource && this.props.resource.name) + "?";

        const disableImageControls = this.state.type === "link";

        const gridViewContainer = (
            <Grid item={true} >
                <div className={classes.imageContainer}>
                    <ResourceImage
                        type={this.state.type}
                        url={this.state.url}
                        name={this.state.name}
                        inverted={this.state.inverted}
                        rotation={this.state.rotation}
                        backgroundColor={this.state.backgroundColor}
                        driveMaxHeight="500"
                        driveMaxWidth="500"
                    />
                </div>
            </Grid>
        );

        return <div>
            <DeleteDialog isOpen={this.state.isConfirmDeleteDialogOpen} title={deleteDialogTitle} text={deleteDialogText} onHandleClose={this.handleConfirmDeleteDialogClosed} />
            <Grid container={true} spacing={8} direction="column">
                <Grid item={true} style={{ flex: 1 }}>
                    <Grid container={true} spacing={8} direction="row">

                        {this.state.displayMode === "right" && gridViewContainer}

                        <Grid item={true}>
                            <Grid container={true} spacing={8} direction="column">
                                <Grid item={true}>
                                    <FormControl component="fieldset" className={classes.formControl}>
                                        <FormLabel component="legend">Type</FormLabel>
                                        <RadioGroup
                                            aria-label="Type"
                                            name="type"
                                            className={classes.group}
                                            value={this.state.type}
                                            onChange={this.handleChange("type")}
                                        >
                                            <FormControlLabel value="image" control={<Radio />} label="Image" />
                                            <FormControlLabel value="sketch" control={<Radio />} label="Sketch" />
                                            <FormControlLabel value="link" control={<Radio />} label="Link" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                                <Grid item={true}>
                                    <FormControl component="fieldset" className={classes.formControl}>
                                        <FormLabel component="legend">White background</FormLabel>
                                        <Checkbox
                                            checked={this.state.backgroundColor >= 255}
                                            onChange={this.handleBackgroundCheckboxChange}
                                            color="primary"
                                            disabled={disableImageControls}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item={true}>
                                    <FormControl component="fieldset" className={classes.formControl}>
                                        <FormLabel component="legend">Inverted</FormLabel>
                                        <Checkbox
                                            checked={this.state.inverted}
                                            onChange={this.handleInvertedCheckboxChange}
                                            color="primary"
                                            disabled={disableImageControls}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item={true}>
                                    <FormControl component="fieldset" className={classes.formControl}>
                                        <FormLabel component="legend">Rotation ({Math.round(this.state.rotation)} deg)</FormLabel>
                                        <div className={classes.sliderContainer}>
                                            <Slider
                                                className={classes.slider}
                                                value={Math.round(this.state.rotation / 3.6)}
                                                onChange={this.handleSliderChange}
                                                disabled={disableImageControls}
                                            />
                                        </div>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Grid>

                        {this.state.displayMode === "left" && gridViewContainer}

                    </Grid>
                </Grid>
                <Grid item={true} xs={11}>
                    <TextField
                        autoFocus={true}
                        margin="dense"
                        label={this.state.type === "sketch" ? "Relative Google Drive path for easier identification" : "Name"}
                        type="text"
                        fullWidth={true}
                        onChange={this.handleChange("name")}
                        value={this.state.name}
                    />
                </Grid>
                <Grid item={true} xs={11}>
                    <TextField
                        style={{ flex: 1 }}
                        autoFocus={true}
                        margin="dense"
                        id="url"
                        name="url"
                        label={this.state.type === "sketch" ? "Google Drive image id" : "Url"}
                        type="text"
                        fullWidth={true}
                        onChange={this.handleChange("url")}
                        value={this.state.url}
                    />
                </Grid>
                <Grid item={true} xs={12}>
                    <Grid container={true} spacing={8} direction="row">
                        <Grid item={true}>
                            <IconButton onClick={this.onClickDelete} >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                        <Grid item={true} style={{ flex: 1, textAlign: "right" }}>
                            {saveSuccess}
                            {error}
                            {circularProgress}
                            <Button onClick={this.handleCloseConfirm} variant="contained" color="primary" autoFocus={true}>
                                {this.props.resource ? "Save changes" : "Add"}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(ResourceView);
