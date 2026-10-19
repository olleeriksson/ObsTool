import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Tooltip from "@mui/material/Tooltip";
import type { Theme } from "@mui/material/styles";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import Api from "../api/Api";
import { IConstellationMapObject, IConstellationStatistics } from "../types/Types";
import ConstellationView from "./ConstellationView";
import { InterstellarumChart } from "./InterstellarumAtlas";

const styles = (theme: Theme) => createStyles({
    titleRoot: {
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        paddingRight: theme.spacing(1),
    },
    // Let the view fill the dialog below its title, including on shorter screens.
    content: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
    },
    loadingRoot: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: 560,
    },
    // Keep navigation, size toggle, and close together without squeezing the title on narrow screens.
    titleControls: {
        alignItems: "center",
        display: "flex",
        flexShrink: 0,
    },
    closeButton: {
        marginLeft: theme.spacing(2),
    },
});

interface IConstellationDialogProps extends WithStyles<typeof styles> {
    open: boolean;
    chart?: InterstellarumChart;
    constellation?: IConstellationStatistics;
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
}

interface IConstellationDialogState {
    isExpanded: boolean;
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
        isExpanded: false,
        isLoading: false,
        isError: false,
        objects: [],
    };

    // Prevent a pending request from updating an unmounted dialog.
    public componentWillUnmount() {
        this.loadRequestId++;
    }

    public componentDidUpdate(prevProps: IConstellationDialogProps) {
        const previousConstellation = prevProps.constellation?.constellationAbbrv;
        const currentConstellation = this.props.constellation?.constellationAbbrv;
        if (this.props.open && (!prevProps.open || previousConstellation !== currentConstellation || prevProps.chart?.chart !== this.props.chart?.chart)) {
            this.loadObjects();
        }
    }

    public render() {
        const { classes, constellation, onClose, open } = this.props;
        const areaType = this.props.chart ? "Interstellarum chart" : "constellation";
        const { isExpanded } = this.state;
        const title = this.props.chart ? `Interstellarum chart ${this.props.chart.chart}` : constellation?.constellation ? `Constellation: ${constellation.constellation}` : "Constellation";
        return (
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth={true}
                maxWidth="lg"
                slotProps={{
                    paper: {
                        style: {
                            // Keep the default view shorter and wider; expanded mode leaves a small background border.
                            width: isExpanded ? "calc(100% - 32px)" : "calc(100% - 48px)",
                            maxWidth: isExpanded ? "none" : 1400,
                            margin: isExpanded ? 12 : "6dvh 24px",
                            height: isExpanded ? "calc(100dvh - 32px)" : "88dvh",
                            maxHeight: isExpanded ? "calc(100dvh - 32px)" : "88dvh",
                        },
                    }
                }}
            >
                <DialogTitle className={classes.titleRoot}>
                    <span>{title}</span>
                    <span className={classes.titleControls}>
                        <Tooltip title={`Previous ${areaType}`}>
                            <span><IconButton aria-label={`Previous ${areaType}`} disabled={!this.props.hasPrevious}
                                onClick={this.props.onPrevious} size="small"><ChevronLeftIcon /></IconButton></span>
                        </Tooltip>
                        <Tooltip title={`Next ${areaType}`}>
                            <span><IconButton aria-label={`Next ${areaType}`} disabled={!this.props.hasNext}
                                onClick={this.props.onNext} size="small"><ChevronRightIcon /></IconButton></span>
                        </Tooltip>
                        <Tooltip title={isExpanded ? "Restore dialog size" : "Expand dialog size"}>
                            <IconButton aria-label={isExpanded ? "Restore dialog size" : "Expand dialog size"}
                                aria-pressed={isExpanded} onClick={() => this.setState({ isExpanded: !isExpanded })} size="small">
                                {isExpanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Tooltip>
                        <IconButton className={classes.closeButton} aria-label={`Close ${areaType} dialog`} onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </span>
                </DialogTitle>
                <DialogContent className={classes.content}>
                    {this.props.chart && <Typography variant="caption" color="textSecondary">
                        Approximate reconstructed atlas footprints. Neighboring charts overlap.
                    </Typography>}
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
        const request = this.props.chart
            ? Api.getH2500ObjectsForInterstellarumMap(this.props.chart.chart)
            : Api.getH2500ObjectsForConstellationMap(constellation.constellationAbbrv);
        request.then(
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
                chart={this.props.chart}
                constellationName={constellation.constellation}
                constellationAbbrv={constellation.constellationAbbrv}
                objects={this.state.objects}
                objectLabel="Unseen H2500"
                backgroundLabel="Observed H2500"
                highlightedLabel="Unseen H400"
            />
        );
    }
}

export default withStyles(styles)(ConstellationDialog);
