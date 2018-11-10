import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import { IObsResource } from "../types/Types";
import ResourceView from "./ResourceView";

const styles = (theme: Theme) => createStyles({
    root: {
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
    fullscreen: boolean;
}

class ResourceDialog extends React.Component<IResourceDialogProps, IResourceDialogState> {
    constructor(props: IResourceDialogProps) {
        super(props);

        this.state = {
            fullscreen: false
        };
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

        const resource1 = (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource1}
                onHandleClose={this.handleCloseConfirm}
                displayMode="left"
            />
        );

        const resource2 = this.props.resource2 && (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource2}
                onHandleClose={this.handleCloseConfirm}
                displayMode="right"
            />
        );

        return <div className={classes.root}>
            <Dialog
                open={this.props.isOpen}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth={false}
            >
                <DialogTitle id="alert-dialog-title">&nbsp;</DialogTitle>
                <DialogContent>
                    <Grid container={true} spacing={8} direction="row">
                        <Grid item={true}>
                            {resource1}
                        </Grid>
                        <Grid item={true} >
                            {resource2 || undefined}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Grid container={true} spacing={8} direction="row">
                        <Grid item={true} style={{ flex: 1 }}>
                            &nbsp;
                        </Grid>
                        <Grid item={true}>
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