import * as React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { IObsSession } from "./Types";

interface IDeleteDialogProps {
    isOpen: boolean;
    obsSession?: IObsSession;
    onHandleClose: (confirm: boolean) => void;
}

class DeleteDialog extends React.Component<IDeleteDialogProps> {
    constructor(props: IDeleteDialogProps) {
        super(props);
    }

    private handleCloseConfirm = () => {
        this.props.onHandleClose(true);
    }

    private handleCloseDiscard = () => {
        this.props.onHandleClose(false);
    }

    public render() {
        return <div>
            <Dialog
                open={this.props.isOpen}
                onClose={this.handleCloseDiscard}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Delete "{this.props.obsSession && this.props.obsSession.title}"?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the observation session titled
                        "{this.props.obsSession && this.props.obsSession.title}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCloseConfirm} variant="contained" color="primary" autoFocus={true}>
                        Delete
                    </Button>
                    <Button onClick={this.handleCloseDiscard} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </div>;
    }
}

export default (DeleteDialog);
