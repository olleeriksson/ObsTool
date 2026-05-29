import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid2";
import { IObsResource } from "../types/Types";
import ResourceView from "./ResourceView";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    dialogPaper: {
    },
    dialogPaperExpanded: {
        width: "calc(100vw - 32px)",
        height: "calc(100vh - 32px)",
        maxWidth: "none",
        maxHeight: "none",
        margin: 16,
    },
    dialogTitle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 0,
    },
    dialogContent: {
        overflow: "auto",
    },
    dialogContentExpanded: {
        flex: 1,
        minHeight: 0,
    },
    resourceGrid: {
        height: "100%",
        overflow: "visible",
        flexWrap: "nowrap",
        columnGap: theme.spacing(2),
    },
    resourceColumn: {
        minWidth: 0,
        display: "flex",
    },
    resourceColumnExpanded: {
        flex: 1,
        height: "100%",
    },
});

interface IResourceDialogProps extends WithStyles<typeof styles> {
    isOpen: boolean;
    onHandleClose: (confirm: boolean) => void;
    resource1?: IObsResource;
    resource2?: IObsResource;  // used when comparing
    observationId: number;  // used when opening the dialog to create a new resource
    displayMode: string;
}

interface IResourceDialogState {
    dialogExpanded: boolean;
    expandedResourceView?: string;
    invertBoth: boolean;
}

class ResourceDialog extends React.Component<IResourceDialogProps, IResourceDialogState> {
    constructor(props: IResourceDialogProps) {
        super(props);

        this.state = {
            dialogExpanded: false,
            expandedResourceView: undefined,
            invertBoth: false
        };
    }

    public componentDidUpdate(prevProps: IResourceDialogProps) {
        if (prevProps.isOpen !== this.props.isOpen) {
            this.setState({ dialogExpanded: false, expandedResourceView: undefined });
        }
    }

    // Toggles dialog-level expansion for the current open dialog only.
    private setDialogExpanded = (dialogExpanded: boolean) => {
        this.setState({ dialogExpanded });
    }

    private onToggleDialogExpanded = () => {
        this.setDialogExpanded(!this.state.dialogExpanded);
    }

    // Tracks which ResourceView owns the expanded image area so compare mode can hide the other resource.
    private handleResourceExpandedChange = (displayMode: string, expanded: boolean) => {
        this.setState({ expandedResourceView: expanded ? displayMode : undefined });
    }

    private onHandleInvertBoth = () => {
        this.setState({
            invertBoth: !this.state.invertBoth
        });
    }

    // When the closing comes from the inner ResourceView (really only from saving)
    private handleCloseConfirm = (confirm: boolean) => {
        if (this.props.displayMode === "edit") {
            this.props.onHandleClose(confirm);
        }
    }

    // When this component is closed
    private handleClose = () => {
        // The flag that says true to reload the resources only actually reaches the resources in this
        // image list. Need to find a way to reload the others.
        this.props.onHandleClose(true);
    }

    public render() {
        const { classes } = this.props;
        const { dialogExpanded, expandedResourceView } = this.state;
        const shouldUseExpandedLayout = dialogExpanded || !!expandedResourceView;
        const dialogPaperClassName = shouldUseExpandedLayout ? `${classes.dialogPaper} ${classes.dialogPaperExpanded}` : classes.dialogPaper;
        const dialogContentClassName = shouldUseExpandedLayout ? `${classes.dialogContent} ${classes.dialogContentExpanded}` : classes.dialogContent;
        const resourceGridClassName = shouldUseExpandedLayout ? `${classes.resourceGrid} ${classes.resourceColumnExpanded}` : classes.resourceGrid;
        const resourceColumnClassName = shouldUseExpandedLayout ? `${classes.resourceColumn} ${classes.resourceColumnExpanded}` : classes.resourceColumn;
        const showResource1 = !expandedResourceView || expandedResourceView === "left";
        const showResource2 = this.props.resource2 && (!expandedResourceView || expandedResourceView === "right");

        const resource1 = showResource1 && (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource1}
                onHandleClose={this.handleCloseConfirm}
                displayMode="left"
                inverted={this.state.invertBoth}
                isExpanded={expandedResourceView === "left"}
                dialogExpanded={dialogExpanded}
                onExpandedChange={this.handleResourceExpandedChange}
            />
        );

        const resource2 = showResource2 && (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource2}
                onHandleClose={this.handleCloseConfirm}
                displayMode="right"
                inverted={this.state.invertBoth}
                isExpanded={expandedResourceView === "right"}
                dialogExpanded={dialogExpanded}
                onExpandedChange={this.handleResourceExpandedChange}
            />
        );

        let invertBothControl;
        if (resource1 && resource2) {
            invertBothControl = (
                <FormControlLabel
                    control={<Switch checked={this.state.invertBoth} onChange={this.onHandleInvertBoth} value="checkedB" color="primary" />}
                    label="View inverted"
                />
            );
        }

        const dialogExpandButton = !expandedResourceView && (
            <Tooltip title={dialogExpanded ? "Collapse dialog" : "Expand dialog"}>
                <IconButton onClick={this.onToggleDialogExpanded} aria-label={dialogExpanded ? "Collapse dialog" : "Expand dialog"} size="small">
                    {dialogExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
                </IconButton>
            </Tooltip>
        );

        return <div className={classes.root}>
            <Dialog
                open={this.props.isOpen}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth={false}
                PaperProps={{ className: dialogPaperClassName }}
            >
                <DialogTitle id="alert-dialog-title" className={classes.dialogTitle}>
                    <span>&nbsp;</span>
                    {dialogExpandButton}
                </DialogTitle>
                <DialogContent className={dialogContentClassName}>
                    <Grid container direction="row" spacing={0} className={resourceGridClassName}>
                        {resource1 && (
                            <Grid className={resourceColumnClassName}>
                                {resource1}
                            </Grid>
                        )}
                        {resource2 && (
                            <Grid className={resourceColumnClassName}>
                                {resource2}
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Grid container spacing={1} direction="row">
                        <Grid size="grow">
                            &nbsp;
                        </Grid>
                        <Grid>
                            {invertBothControl}
                            <Button onClick={this.handleClose} color="primary">
                                Close
                            </Button>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>

        </div>;
    }
}

export default withStyles(styles)(ResourceDialog);
