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
import axios from "axios";
import { IObsSession, IObsSessionReducer } from "./Types";
import ObsSessionList from "./ObsSessionList";
import ObsSessionPage from "./ObsSessionPage";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { IAppState } from "./Types";
import * as actions from "../actions/actions";

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
    store: IObsSessionReducer;
}

interface IListViewState {
    isLoadingObsSessions: boolean;
    isErrorObsSessions: boolean;
    obsSessions?: IObsSession[];
    selectedObsSession?: IObsSession;
}

class ListView extends React.Component<IListViewProps, IListViewState> {
    constructor(props: IListViewProps) {
        super(props);

        this.state = {
            isLoadingObsSessions: true,
            isErrorObsSessions: false,
            obsSessions: undefined,
            selectedObsSession: undefined,
        };

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
        this.onSelectObservation = this.onSelectObservation.bind(this);
        this.onIncrement = this.onIncrement.bind(this);
        this.onDecrement = this.onDecrement.bind(this);
    }

    private onIncrement() {
        console.log("onIncrement " + this.props.store.num);
        if (this.props.onIncrement) {
            console.log("dispatching event");
            this.props.onIncrement();
        }
    }

    private onDecrement() {
        console.log("onDecrement " + this.props.store.num);
        if (this.props.onDecrement) {
            console.log("dispatching event");
            this.props.onDecrement();
        }
    }

    public componentDidMount() {
        this.loadAllObsSessions();
    }

    private loadAllObsSessions = () => {
        axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ obsSessions: data });
                this.setState({ isLoadingObsSessions: false });
                this.setState({ isErrorObsSessions: false });
            },
            () => {
                this.setState({ isLoadingObsSessions: false });
                this.setState({ isErrorObsSessions: true });
            }
        );
    }

    public onSelectObsSession = (obsSessionId: number) => {
        if (this.state.obsSessions) {
            // Get it and store it
            const selectedObsSession = this.state.obsSessions.find(s => s.id === obsSessionId);
            this.setState({ selectedObsSession: selectedObsSession });
        }
    }

    public onUpdatedObsSession = (updatedObsSession: IObsSession) => {
        // Replace the observation session in the list of sessions in the state and update to reflect the made changes visually
        if (this.state.obsSessions) {
            const updatedObsSessionList = this.state.obsSessions.map(o => {
                return o.id === updatedObsSession.id ? updatedObsSession : o;  // replace this particular ObsSession
            });
            this.setState({ obsSessions: updatedObsSessionList });
        }
    }

    public onDeletedObsSession = (obsSessionId: number) => {
        // Remove the observation session from the list of sessions in the state
        if (this.state.obsSessions) {
            const updatedObsSessionList = this.state.obsSessions.filter(o => {
                return o.id !== obsSessionId;
            });
            this.setState({ obsSessions: updatedObsSessionList });
            this.setState({ selectedObsSession: undefined });
        }
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    public render() {
        const { classes } = this.props;

        console.log("Local props");
        console.log(this.props);
        console.log(this.props.store);

        let leftSideView;
        if (this.state.isLoadingObsSessions) {
            leftSideView = (
                <div>
                    <CircularProgress />
                </div>
            );
        } else if (this.state.isErrorObsSessions) {
            leftSideView = (
                <div>
                    Error loading observation sessions!
                </div>
            );
        } else if (this.state.obsSessions) {
            leftSideView = (
                <div className={classes.sessionList}>
                    <p>From redux: {this.props.store.num}</p>
                    <button onClick={this.onIncrement}>Increment</button>
                    <button onClick={this.onDecrement}>Decrement</button>
                    <ObsSessionList
                        obsSessions={this.state.obsSessions || []}
                        onSelectObsSession={this.onSelectObsSession}
                    />
                </div>
            );
        }

        let rightSideView;
        if (this.state.selectedObsSession) { // default view
            const selectedObsSessionId = this.state.selectedObsSession ? this.state.selectedObsSession.id : 0;
            rightSideView = (
                <ObsSessionPage obsSessionId={selectedObsSessionId} onUpdatedObsSession={this.onUpdatedObsSession} onDeletedObsSession={this.onDeletedObsSession} />
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
        store: state.obsSessions
    };
};

export function mapDispatchToProps(dispatch: Dispatch<actions.ObsSessionAction>) {
    return {
        onIncrement: () => dispatch(actions.createIncrementAction()),
        onDecrement: () => dispatch(actions.createDecrementAction()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ListView));
