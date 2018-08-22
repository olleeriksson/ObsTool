import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import "./Layout.css";
import axios from "axios";
import { IObsSession } from "./Types";
import ObsSessionList from "./ObsSessionList";
// import ObservationList from "./ObservationList";
import ObsSessionPage from "./ObsSessionPage";

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
    children?: React.ReactNode;
}

interface IListViewState {
    isLoadingObsSessions: boolean;
    isLoadingSelectedObsSession: boolean;
    isErrorObsSessions: boolean;
    isErrorSelectedObsSession: boolean;
    obsSessions?: IObsSession[];
    selectedObsSession?: IObsSession;
}

class ListView extends React.Component<IListViewProps, IListViewState> {
    constructor(props: IListViewProps) {
        super(props);

        this.state = {
            isLoadingObsSessions: true,
            isLoadingSelectedObsSession: false,
            isErrorSelectedObsSession: false,
            isErrorObsSessions: false,
            obsSessions: undefined,
            selectedObsSession: undefined,
        };

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
        this.onSelectObservation = this.onSelectObservation.bind(this);
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

    private loadObsSession = (obsSessionId: number) => {
        axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeLocation=true&includeObservations=true&includeDso=true").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ selectedObsSession: data });
                this.setState({ isLoadingSelectedObsSession: false });
                this.setState({ isErrorSelectedObsSession: false });
            },
            () => {
                this.setState({ isLoadingSelectedObsSession: false });
                this.setState({ isErrorSelectedObsSession: true });
            }
        );
    }

    public onSelectObsSession = (obsSessionId: number) => {
        if (this.state.obsSessions) {
            // Get it and store it
            const selectedObsSession = this.state.obsSessions.find(s => s.id === obsSessionId);
            this.setState({ selectedObsSession: selectedObsSession });

            // Load it again to get more data, including the observations and dso's etc
            if (selectedObsSession) {
                console.log("Selected a new obs session with id " + selectedObsSession.id);
                this.loadObsSession(selectedObsSession.id || 0);
                console.log("Clicked on obs session_ " + obsSessionId);
            }
        }
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    public render() {
        const { classes } = this.props;

        let rightSideHeading;
        if (this.state.selectedObsSession) {
            const selectedObsSessionId = this.state.selectedObsSession ? this.state.selectedObsSession.id : 0;
            rightSideHeading = (
                <ObsSessionPage obsSessionId={selectedObsSessionId} />
            );
        } else {
            rightSideHeading = (
                <Typography variant="title" align="center" color="textPrimary" component="p">
                    <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" /> Observations
                </Typography>
            );
        }

        return <div className={classes.root}>
            <Grid container={true} spacing={40} alignItems="flex-start">
                <Grid item={true} xs={12} sm={12} md={5} className={classes.column}>
                    <Typography variant="title" align="center" color="textPrimary" component="p">
                        <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" /> Sessions
                    </Typography>

                    <div className={classes.sessionList}>
                        <ObsSessionList
                            obsSessions={this.state.obsSessions || []}
                            onSelectObsSession={this.onSelectObsSession}
                        />
                    </div>
                </Grid>
                <Grid item={true} xs={12} sm={12} md={7} className={classes.column}>
                    <Paper className={classes.observationPaper} elevation={1}>
                        {rightSideHeading}
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(ListView);
