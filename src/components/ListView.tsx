import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import "./Layout.css";
// import { IObsSession } from "./Types";
import ObsSessionList from "./ObsSessionList";
import ObsSessionPage from "./ObsSessionPage";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "./Types";
import * as actions from "../actions/ObsSessionActions";
import Api from "../api/Api";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing.unit * 1,
    },
    column: {
        marginTop: theme.spacing.unit * 2,
        // padding: "1em !important",
    },
    sessionList: {
        marginTop: theme.spacing.unit * 2,
    },
    observationPaper: {
        marginTop: theme.spacing.unit * 2,
        padding: theme.spacing.unit * 2,
    },
});

interface IListViewProps extends WithStyles<typeof styles> {
    onIncrement?: () => void;
    onDecrement?: () => void;
    store: ReadonlyDataState;
    actions: any;
    dispatch: any;
}

class ListView extends React.Component<IListViewProps> {
    constructor(props: IListViewProps) {
        super(props);

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
    }

    public componentDidMount() {
        this.loadAllObsSessions();
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
            this.props.actions.selectObsSession(obsSessionId);
        }
    }

    public render() {
        const { classes } = this.props;

        console.log("Local props");
        console.log(this.props);
        console.log(this.props.store);

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
        if (this.props.store.selectedObsSessionId) { // default view
            rightSideView = (
                <ObsSessionPage obsSessionId={this.props.store.selectedObsSessionId} />
            );
        } else { // empty view
            rightSideView = (
                <Typography variant="title" align="center" color="textPrimary" component="p">
                    <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" /> Observations
                </Typography>
            );
        }

        return <div className={classes.root}>
            <Grid container={true} spacing={40} alignItems="flex-start">
                <Grid item={true} xs={12} sm={4} className={classes.column}>
                    <Typography variant="title" align="center" color="textPrimary" component="p">
                        <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" /> Sessions
                    </Typography>
                    {leftSideView}
                </Grid>
                <Grid item={true} xs={12} sm={8} className={classes.column}>
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

// export function mapDispatchToProps(dispatch: Dispatch<actions.ObsSessionAction>) {
//     return {
//         getObsSessions: () => dispatch(actions.getObsSessions()),
//         getObsSessionsSuccess: (obsSessions: IObsSession[]) => dispatch(actions.getObsSessionsSuccess(obsSessions)),
//         getObsSessionsFailure: (error: string) => dispatch(actions.getObsSessionsFailure(error)),
//         onIncrement: () => dispatch(actions.createIncrementAction()),
//         onDecrement: () => dispatch(actions.createDecrementAction()),
//     };
// }

const mapDispatchToProps = (dispatch: Dispatch<actions.ObsSessionAction>) => {
    return {
        actions: bindActionCreators(
            actions,
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ListView));
