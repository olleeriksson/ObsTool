import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface IDeleteDialogProps {
    isOpen: boolean;
    title: string;
    text: string;
    finalWarningText?: string;
    requireSecondDeleteClick?: boolean;
    showWarningSign?: boolean;
    onHandleClose: (confirm: boolean) => void;
}

interface IDeleteDialogState {
    isAwaitingSecondClick: boolean;
    secondClickEnabledAt: number;
    now: number;
}

class DeleteDialog extends React.Component<IDeleteDialogProps, IDeleteDialogState> {
    private secondClickTimer?: number;

    constructor(props: IDeleteDialogProps) {
        super(props);

        this.state = {
            isAwaitingSecondClick: false,
            secondClickEnabledAt: 0,
            now: Date.now()
        };
    }

    // Resets the two-step confirmation whenever a destructive dialog is closed or reopened.
    public componentDidUpdate(prevProps: IDeleteDialogProps) {
        if (prevProps.isOpen !== this.props.isOpen) {
            this.resetSecondClickState();
        }
    }

    // Clears the countdown timer if the dialog component is removed while the timer is active.
    public componentWillUnmount() {
        this.clearSecondClickTimer();
    }

    // Either starts the required two-second confirmation delay or confirms the delete after the second click.
    private handleCloseConfirm = () => {
        if (this.props.requireSecondDeleteClick && !this.state.isAwaitingSecondClick) {
            const secondClickEnabledAt = Date.now() + 2000;
            this.setState({
                isAwaitingSecondClick: true,
                secondClickEnabledAt,
                now: Date.now()
            });
            this.startSecondClickTimer();
            return;
        }

        if (this.props.requireSecondDeleteClick && this.getRemainingDelayMs() > 0) {
            return;
        }

        this.resetSecondClickState();
        this.props.onHandleClose(true);
    }

    // Cancels the delete dialog without confirming the destructive action.
    private handleCloseDiscard = () => {
        this.resetSecondClickState();
        this.props.onHandleClose(false);
    }

    // Starts a short timer so the disabled Delete button becomes clickable as soon as the delay has passed.
    private startSecondClickTimer() {
        this.clearSecondClickTimer();
        this.secondClickTimer = window.setInterval(() => {
            if (this.getRemainingDelayMs() <= 0) {
                this.clearSecondClickTimer();
            }

            this.setState({ now: Date.now() });
        }, 250);
    }

    // Stops any active countdown timer for the second delete click.
    private clearSecondClickTimer() {
        if (this.secondClickTimer !== undefined) {
            window.clearInterval(this.secondClickTimer);
            this.secondClickTimer = undefined;
        }
    }

    // Returns how long the user still has to wait before the final Delete click is allowed.
    private getRemainingDelayMs() {
        return Math.max(0, this.state.secondClickEnabledAt - this.state.now);
    }

    // Restores the dialog to its initial single-click state and clears timer state.
    private resetSecondClickState() {
        this.clearSecondClickTimer();
        this.setState({
            isAwaitingSecondClick: false,
            secondClickEnabledAt: 0,
            now: Date.now()
        });
    }

    // Keeps the destructive action label stable while the delay controls availability.
    private getDeleteButtonLabel() {
        return "Delete";
    }

    // Renders the optional visual warning block for high-impact delete operations.
    private renderWarningSign() {
        if (!this.props.showWarningSign) {
            return undefined;
        }

        return (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <WarningAmberIcon style={{ color: "#000", fontSize: 72 }} />
            </div>
        );
    }

    public render() {
        const isDeleteDisabled = this.props.requireSecondDeleteClick
            && this.state.isAwaitingSecondClick
            && this.getRemainingDelayMs() > 0;
        const finalWarningText = this.props.finalWarningText
            || "Please reconfirm that you want to permanently delete this item. Click Delete to continue.";

        return <div>
            <Dialog
                open={this.props.isOpen}
                onClose={this.handleCloseDiscard}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle>
                <DialogContent>
                    {this.renderWarningSign()}
                    <DialogContentText id="alert-dialog-description">
                        {this.props.text}
                    </DialogContentText>
                    {this.props.requireSecondDeleteClick && this.state.isAwaitingSecondClick && (
                        <DialogContentText color="error" style={{ marginTop: 16 }}>
                            {finalWarningText}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.handleCloseConfirm}
                        variant="contained"
                        color="error"
                        autoFocus={true}
                        disabled={isDeleteDisabled}
                    >
                        {this.getDeleteButtonLabel()}
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
