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
    invertBoth: boolean;
}

class ResourceDialog extends React.Component<IResourceDialogProps, IResourceDialogState> {
    constructor(props: IResourceDialogProps) {
        super(props);

        this.state = {
            fullscreen: false,
            invertBoth: false
        };
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

        const resource1 = (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource1}
                onHandleClose={this.handleCloseConfirm}
                displayMode="left"
                inverted={this.state.invertBoth}
            />
        );

        const resource2 = this.props.resource2 && (
            <ResourceView
                observationId={this.props.observationId}
                resource={this.props.resource2}
                onHandleClose={this.handleCloseConfirm}
                displayMode="right"
                inverted={this.state.invertBoth}
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
                    <Grid container direction="row" spacing={0} style={{ overflow: "hidden" }}>
                        <Grid>
                            {resource1}
                        </Grid>
                        <Grid>
                            {resource2 || undefined}
                        </Grid>
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