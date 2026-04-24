import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface IDeleteDialogProps {
    isOpen: boolean;
    title: string;
    text: string;
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
                <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {this.props.text}
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
