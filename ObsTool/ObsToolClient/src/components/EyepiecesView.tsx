import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Api from "../api/Api";
import { IEyepiece, IAppState, IDataState } from "src/types/Types";
import classNames from "classnames";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    textfieldPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
    textfield: {
        margin: theme.spacing(1),
        width: "95%"
    },
    textfieldNarrow: {
        margin: theme.spacing(1),
        width: "50%"
    },
    form: {
        display: "flex",
        flexWrap: "wrap",
    },
    formControl: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: "95%",
    },
    textField: {
    }
});

interface IEyepiecesViewProps extends WithStyles<typeof styles> {
    store: IDataState;
}

interface IEyepiecesViewState {
    isLoading: boolean;
    isError: boolean;
    eyepieces: IEyepiece[];
    currentEyepiece: IEyepiece;
    isConfirmDeleteOpen: boolean;
}

class EyepiecesView extends React.Component<IEyepiecesViewProps, IEyepiecesViewState> {
    constructor(props: IEyepiecesViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            eyepieces: [],
            currentEyepiece: this.getEmptyEyepiece(),
            isConfirmDeleteOpen: false
        };
    }

    private getEmptyEyepiece = (): IEyepiece => {
        return {
            id: undefined,
            key: "",
            name: "",
            focalLengthMm: ""
        };
    }

    public componentDidMount() {
        this.loadFromApi();
    }

    private loadFromApi() {
        this.setState({ currentEyepiece: this.getEmptyEyepiece() });
        this.setState({ isLoading: true });
        Api.getEyepieces().then(
            (response) => {
                this.setState({ eyepieces: response.data, isLoading: false, isError: false });
            }).catch(
                () => {
                    this.setState({ isLoading: false, isError: true });
                }
            );
    }

    private handleFormChange = (name: string) => (event: any) => {
        const newValue = event.target.value;
        this.setState((prevState) => ({
            currentEyepiece: {
                ...prevState.currentEyepiece,
                [name]: newValue
            }
        }));
    }

    private handleClickResource = (eyepieceId?: number) => (event: any) => {
        event.preventDefault();
        const clicked = this.state.eyepieces.find(e => e.id === eyepieceId);
        if (clicked) {
            this.setState({ currentEyepiece: clicked });
        }
    }

    private onClear = () => {
        this.setState({ currentEyepiece: this.getEmptyEyepiece(), isError: false });
    }

    private onClickDelete = () => {
        this.setState({ isConfirmDeleteOpen: true });
    }

    private onConfirmDelete = () => {
        this.setState({ isConfirmDeleteOpen: false });
        if (this.state.currentEyepiece.id) {
            this.setState({ isLoading: true, isError: false });
            Api.deleteEyepiece(this.state.currentEyepiece.id).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        }
    }

    private onCancelDelete = () => {
        this.setState({ isConfirmDeleteOpen: false });
    }

    private handleSubmit = (e: any) => {
        e.preventDefault();
        this.setState({ isLoading: true, isError: false });
        if (this.state.currentEyepiece.id) {
            Api.updateEyepiece(this.state.currentEyepiece).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        } else {
            Api.addEyepiece(this.state.currentEyepiece).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        }
    }

    public render() {
        const { classes } = this.props;

        const circularProgress = this.state.isLoading
            ? <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />
            : null;

        const keyWarning = this.state.currentEyepiece.id
            ? (
                <Typography variant="caption" style={{ color: "#f57c00", marginLeft: 8, display: "inline-flex", alignItems: "center", alignmentBaseline: "middle", gap: 4 }}>
                    <FontAwesomeIcon icon="exclamation-triangle" />
                    Changing the key may have unexpected consequences
                </Typography>
            )
            : null;

        const confirmDeleteDialog = (
            <Dialog open={this.state.isConfirmDeleteOpen} onClose={this.onCancelDelete}>
                <DialogTitle>Delete eyepiece?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{this.state.currentEyepiece.name}</strong>? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCancelDelete} color="primary">Cancel</Button>
                    <Button onClick={this.onConfirmDelete} color="primary">Delete</Button>
                </DialogActions>
            </Dialog>
        );

        const eyepieceForm = (
            <div>
                <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
                    <Grid container direction="column" size="grow">
                        <Grid style={{ display: "flex", alignItems: "center" }}>
                            <TextField
                                id="key"
                                label="Key"
                                value={this.state.currentEyepiece.key || ""}
                                onChange={this.handleFormChange("key")}
                                className={classNames(classes.formControl, classes.textfieldNarrow)}
                                margin="dense"
                            />
                            {keyWarning}
                        </Grid>
                        <Grid>
                            <TextField
                                id="name"
                                label="Name"
                                value={this.state.currentEyepiece.name || ""}
                                onChange={this.handleFormChange("name")}
                                className={classNames(classes.formControl, classes.textField)}
                                margin="dense"
                            />
                        </Grid>
                        <Grid>
                            <TextField
                                id="focalLengthMm"
                                label="Focal length (mm)"
                                value={this.state.currentEyepiece.focalLengthMm || ""}
                                onChange={this.handleFormChange("focalLengthMm")}
                                className={classNames(classes.formControl, classes.textfieldNarrow)}
                                margin="dense"
                            />
                        </Grid>
                        <Grid>
                            <Grid container direction="row">
                                <Grid>
                                    <Button variant="contained" color="primary" type="submit" disabled={!this.props.store.isLoggedIn}>
                                        {this.state.currentEyepiece.id ? "Update" : "Save"}
                                    </Button>
                                    <Button color="primary" onClick={this.onClear}>
                                        Clear
                                    </Button>
                                    {circularProgress}
                                    {this.state.isError ? <span style={{ color: "red", fontWeight: "bold" }}>Error saving!</span> : null}
                                </Grid>
                                <Grid size="grow" style={{ textAlign: "right" }}>
                                    <IconButton onClick={this.onClickDelete} disabled={!this.props.store.isLoggedIn || !this.state.currentEyepiece.id}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>
            </div>
        );

        const eyepieceList = this.state.eyepieces.map(eyepiece => (
            <Grid key={eyepiece.id} size={12}>
                <Typography variant="subtitle1" gutterBottom={true}>
                    {eyepiece.name} <span style={{ color: "gray", fontSize: "0.85em" }}>({eyepiece.key})</span>
                    <a href="" onClick={this.handleClickResource(eyepiece.id)}>
                        <EditIcon style={{ fontSize: 16, marginLeft: "1em" }} />
                    </a>
                </Typography>
                <Typography variant="caption" gutterBottom={true}>
                    Focal length: <strong>{eyepiece.focalLengthMm || "N/A"} mm</strong>
                </Typography>
            </Grid>
        ));

        return <div className={classes.root}>
            {confirmDeleteDialog}
            <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                <FontAwesomeIcon icon="eye" className="faSpaceAfter" /> Eyepieces
            </Typography>
            <Grid container spacing={5} justifyContent="center" direction="row">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        {eyepieceForm}
                    </Paper>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <Grid container spacing={3} direction="column">
                            {eyepieceList}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

export default connect(mapStateToProps)(withStyles(styles)(EyepiecesView));
