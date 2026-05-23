import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import type { Theme } from "@mui/material/styles";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import Api from "../api/Api";
import { IConstellationMapObject, IConstellationStatistics } from "../types/Types";
import ConstellationView from "./ConstellationView";

const styles = (theme: Theme) => createStyles({
    titleRoot: {
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        paddingRight: theme.spacing(1),
    },
    content: {
        minHeight: 850,
    },
    loadingRoot: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: 560,
    },
    closeButton: {
        marginLeft: theme.spacing(2),
    },
});

interface IConstellationDialogProps extends WithStyles<typeof styles> {
    open: boolean;
    constellation?: IConstellationStatistics;
    onClose: () => void;
}

interface IConstellationDialogState {
    isLoading: boolean;
    isError: boolean;
    objects: IConstellationMapObject[];
}

/**
 * Launched from the constellation stats table on the front page. Just the dialog, holds the ConstellationView.
 */
class ConstellationDialog extends React.Component<IConstellationDialogProps, IConstellationDialogState> {
    private loadRequestId = 0;

    public state: IConstellationDialogState = {
        isLoading: false,
        isError: false,
        objects: [],
    };

    public componentDidUpdate(prevProps: IConstellationDialogProps) {
        const previousConstellation = prevProps.constellation?.constellationAbbrv;
        const currentConstellation = this.props.constellation?.constellationAbbrv;
        if (this.props.open && (!prevProps.open || previousConstellation !== currentConstellation)) {
            this.loadObjects();
        }
    }

    public render() {
        const { classes, constellation, onClose, open } = this.props;
        const title = constellation?.constellation ? `Constellation: ${constellation.constellation}` : "Constellation";
        return (
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth={true}
                maxWidth="lg"
                PaperProps={{ style: { width: "94vw", maxWidth: 1320, minHeight: "92vh" } }}
            >
                <DialogTitle className={classes.titleRoot}>
                    <span>{title}</span>
                    <IconButton className={classes.closeButton} aria-label="Close constellation dialog" onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent className={classes.content}>
                    {this.renderContent()}
                </DialogContent>
            </Dialog>
        );
    }

    private loadObjects() {
        const constellation = this.props.constellation;
        if (!constellation) {
            return;
        }

        const requestId = ++this.loadRequestId;
        this.setState({ isLoading: true, isError: false, objects: [] });
        Api.getH2500ObjectsForConstellationMap(constellation.constellationAbbrv).then(
            response => {
                if (requestId === this.loadRequestId) {
                    this.setState({ objects: response.data, isLoading: false });
                }
            },
            () => {
                if (requestId === this.loadRequestId) {
                    this.setState({ isError: true, isLoading: false });
                }
            });
    }

    private renderContent() {
        const { classes, constellation } = this.props;
        if (!constellation) {
            return null;
        }

        if (this.state.isLoading) {
            return (
                <div className={classes.loadingRoot}>
                    <CircularProgress className="faSpaceAfter" /> Loading Herschel objects...
                </div>
            );
        }

        if (this.state.isError) {
            return (
                <Typography component="div" color="error" align="center">
                    Could not load Herschel objects for {constellation.constellation}.
                </Typography>
            );
        }

        return (
            <ConstellationView
                constellationName={constellation.constellation}
                constellationAbbrv={constellation.constellationAbbrv}
                objects={this.state.objects}
                objectLabel="Unseen Herschel 2500"
                backgroundLabel="Already observed"
                highlightedLabel="Unseen Herschel 400"
            />
        );
    }
}

export default withStyles(styles)(ConstellationDialog);
