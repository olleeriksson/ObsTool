import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { IObsResource } from "./Types";
import TextField from "@material-ui/core/TextField";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Api from "../api/Api";
import DeleteIcon from "@material-ui/icons/Delete";
import ErrorIcon from "@material-ui/icons/Error";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import DeleteDialog from "./DeleteDialog";
import Grid from "@material-ui/core/Grid";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    imageContainer: {
    },
    image: {
        border: 1,
        width: 200,
    },
    formControl: {
        margin: theme.spacing.unit * 3,
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
});

interface IEditResourceDialogProps extends WithStyles<typeof styles> {
    isOpen: boolean;
    observationId: number;
    resource?: IObsResource;
    onHandleClose: (confirm: boolean) => void;
}

interface IEditResourceDialogState {
    isLoading: boolean;
    isError: boolean;
    isConfirmDeleteDialogOpen: boolean;
    type: string;
    name?: string;
    url?: string;
}

class EditResourceDialog extends React.Component<IEditResourceDialogProps, IEditResourceDialogState> {
    constructor(props: IEditResourceDialogProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            isConfirmDeleteDialogOpen: false,
            type: "sketch",
            name: "",
            url: ""
        };
    }

    public componentWillReceiveProps(nextProps: IEditResourceDialogProps) {
        if (nextProps.resource && this.props.resource !== nextProps.resource) {
            // Load from new object
            this.setState({
                type: nextProps.resource.type,
                name: (nextProps.resource.name || undefined),
                url: (nextProps.resource.url || undefined),
            });
        }
    }

    private handleChange = (name: string) => (event: any) => {
        const newValue = event.target.value;
        this.setState((prevState, props) => ({
            ...prevState,
            [name]: newValue
        }));
    }

    private saveResource = () => {
        this.setState({ isLoading: true });

        const newResource = {
            id: this.props.resource && this.props.resource.id,
            type: this.state.type,
            name: this.state.name,
            url: this.state.url
        };

        if (!this.props.resource || !this.props.resource.id) {
            Api.addResource(this.props.observationId, newResource).then(
                () => {
                    this.setState({ isLoading: false });
                    this.props.onHandleClose(true);
                },
                () => this.indicateError()
            );
        } else {
            Api.updateResource(newResource).then(
                () => {
                    this.setState({ isLoading: false });
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
    }

    private handleCloseConfirm = () => {
        this.saveResource();
    }

    private handleCloseDiscard = () => {
        this.props.onHandleClose(false);
    }

    public render() {
        const { classes } = this.props;

        let imagePreview;
        if (this.state.url && (this.state.type === "sketch" || this.state.type === "image")) {
            imagePreview = <img src={this.state.url} title={this.state.name} className={classes.image} />;
        }

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

        const deleteDialogTitle = "Delete " + (this.props.resource && this.props.resource.type) + "?";
        const deleteDialogText = "Are you sure you want to delete the " + (this.props.resource && this.props.resource.type) +
            " " + (this.props.resource && this.props.resource.name) + "?";

        return <div>
            <DeleteDialog isOpen={this.state.isConfirmDeleteDialogOpen} title={deleteDialogTitle} text={deleteDialogText} onHandleClose={this.handleConfirmDeleteDialogClosed} />
            <Dialog
                open={this.props.isOpen}
                onClose={this.handleCloseDiscard}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{this.props.resource ? "Edit" : "New"} Resource</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Hey hey
                    </DialogContentText>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Type</FormLabel>
                        <RadioGroup
                            aria-label="Type"
                            name="type"
                            className={classes.group}
                            value={this.state.type}
                            onChange={this.handleChange("type")}
                        >
                            <FormControlLabel value="sketch" control={<Radio />} label="Sketch" />
                            <FormControlLabel value="image" control={<Radio />} label="Image" />
                            <FormControlLabel value="link" control={<Radio />} label="Link" />
                        </RadioGroup>
                    </FormControl>
                    {imagePreview}
                    <TextField
                        autoFocus={true}
                        margin="dense"
                        id="name"
                        name="name"
                        label="Name"
                        type="text"
                        fullWidth={true}
                        onChange={this.handleChange("name")}
                        value={this.state.name}
                    />
                    <TextField
                        autoFocus={true}
                        margin="dense"
                        id="url"
                        name="url"
                        label="url"
                        type="text"
                        fullWidth={true}
                        onChange={this.handleChange("url")}
                        value={this.state.url}
                    />
                </DialogContent>
                <DialogActions>
                    <Grid container={true} spacing={8} direction="row">
                        <Grid item={true} style={{ flex: 1 }}>
                            <IconButton onClick={this.onClickDelete} >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                        <Grid item={true}>
                            {error}
                            {circularProgress}
                            <Button onClick={this.handleCloseConfirm} variant="contained" color="primary" autoFocus={true}>
                                {this.props.resource ? "Save changes" : "Add"}
                            </Button>
                            <Button onClick={this.handleCloseDiscard} color="primary">
                                Cancel
                            </Button>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>
        </div>;
    }
}

export default withStyles(styles)(EditResourceDialog);
