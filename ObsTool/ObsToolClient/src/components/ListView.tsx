import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import "./Layout.css";
// import { IObsSession } from "../types/Types";
import ObsSessionList from "./ObsSessionList";
import ObsSessionPage from "./ObsSessionPage";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/ObsSessionActions";
import Api from "../api/Api";
import TelescopeIcon from "./icons/TelescopeIcon";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(1),
    },
    column: {
        marginTop: theme.spacing(2),
        // padding: "1em !important",
    },
    sessionList: {
        marginTop: theme.spacing(2),
    },
    observationPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
});

interface IListViewProps extends WithStyles<typeof styles> {
    onIncrement?: () => void;
    onDecrement?: () => void;
    obsSessionId?: number;
    store: ReadonlyDataState;
    actions: any;
}

class ListView extends React.Component<IListViewProps> {
    constructor(props: IListViewProps) {
        super(props);

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
    }

    public componentDidMount() {
        this.loadAllObsSessions();
        this.selectRouteObsSession();
    }

    public componentDidUpdate(prevProps: IListViewProps) {
        if (this.props.obsSessionId !== prevProps.obsSessionId) {
            this.selectRouteObsSession();
        }
    }

    private selectRouteObsSession = () => {
        if (this.props.obsSessionId && this.props.store.selectedObsSessionId !== this.props.obsSessionId) {
            // Direct entry and post-create redirects carry the session id in the route; mirror it into the split-view selection state.
            this.props.actions.selectObsSession(this.props.obsSessionId);
        }
    }

    private loadAllObsSessions = () => {
        this.props.actions.getObsSessionsBegin();
        Api.getObsSessionsSimple().then(
            (response) => {
                this.props.actions.getObsSessionsSuccess(response.data);
            }).catch(
                (error) => this.props.actions.getObsSessionsFailure(error)
            );
    }

    public onSelectObsSession = (obsSessionId: number) => {
        if (this.props.store.obsSessions) {
            // Keep the split view mounted so the session-list pagination does not reset while the URL reflects the selection.
            this.props.actions.selectObsSession(obsSessionId);
            this.replaceSessionsUrl(obsSessionId);
        }
    }

    private replaceSessionsUrl = (obsSessionId: number) => {
        if (typeof window !== "undefined") {
            const basePath = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
            const nextPath = `${basePath}/sessions/${obsSessionId}`;
            if (window.location.pathname !== nextPath) {
                window.history.pushState(null, "", nextPath);
            }
        }
    }

    public render() {
        const { classes } = this.props;

        let leftSideView;
        if (this.props.store.isLoadingObsSessions) {
            leftSideView = (
                <div>
                    <CircularProgress />
                </div>
            );
        } else if (this.props.store.isErrorObsSessions) {
            leftSideView = (
                <div>
                    {this.props.store.isErrorObsSessions.toString()}
                </div>
            );
        } else if (this.props.store.obsSessions) {
            leftSideView = (
                <div className={classes.sessionList}>
                    <ObsSessionList
                        obsSessions={this.props.store.obsSessions}
                        onSelectObsSession={this.onSelectObsSession}
                    />
                </div>
            );
        }

        let rightSideView;
        const selectedObsSessionId = this.props.store.selectedObsSessionId || this.props.obsSessionId;
        if (selectedObsSessionId) { // default view
            rightSideView = (
                <ObsSessionPage obsSessionId={selectedObsSessionId} />
            );
        } else { // empty view
            rightSideView = (
                <Typography variant="h6" align="center" color="textPrimary" component="p">
                    <TelescopeIcon variant="telescope1" className="faSpaceAfter" /> Observations
                </Typography>
            );
        }

        return <div className={classes.root}>
            <Grid container spacing={5} alignItems="flex-start">
                <Grid size={{ xs: 12, lg: 4 }} className={classes.column}>
                    <Typography variant="h6" align="center" color="textPrimary" component="p">
                        <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" /> Sessions
                    </Typography>
                    {leftSideView}
                </Grid>
                <Grid size={{ xs: 12, lg: 8 }} className={classes.column}>
                    <Paper className={classes.observationPaper} elevation={1}>
                        {rightSideView}
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data as ReadonlyDataState
    };
};

const mapDispatchToProps = (dispatch: Dispatch<actions.ObsSessionAction>) => {
    return {
        actions: bindActionCreators(
            actions,
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ListView));
