import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Typography from "@material-ui/core/Typography";
import "./ObsSessionPage.css";
import axios from "axios";
import { IObsSession, IObservation } from "./Types";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import ObservationList from "./ObservationList";
import ObsSessionForm from "./ObsSessionForm";
import SwipeableViews from "react-swipeable-views";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme: Theme) => createStyles({
    root: {
        backgroundColor: theme.palette.background.paper,
    },
});

interface IObsSessionPageProps extends WithStyles<typeof styles> {
    obsSessionId?: number;
}

interface IObsSessionPageState {
    isLoading: boolean;
    isError: boolean;
    activeView: number;
    obsSession?: IObsSession;
}

class ObsSessionPage extends React.Component<IObsSessionPageProps, IObsSessionPageState> {
    constructor(props: IObsSessionPageProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            activeView: 0,
            obsSession: undefined,
        };

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
        this.onSelectObservation = this.onSelectObservation.bind(this);
        this.onSaveObservation = this.onSaveObservation.bind(this);
    }

    public componentDidMount() {
        if (this.props.obsSessionId) {
            this.loadObsSession(this.props.obsSessionId);
        }
    }

    public componentWillReceiveProps(nextProps: IObsSessionPageProps) {
        if (nextProps.obsSessionId && this.props.obsSessionId !== nextProps.obsSessionId) {
            this.loadObsSession(nextProps.obsSessionId);
        }
    }

    private loadObsSession = (obsSessionId: number) => {
        axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeLocation=true&includeObservations=true&includeDso=true").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ obsSession: data });
                this.setState({ isLoading: false });
                this.setState({ isError: false });
            },
            () => {
                this.setState({ isLoading: false });
                this.setState({ isError: true });
            }
        );
    }

    public onSelectObsSession = (obsSessionId: number) => {
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    public onSaveObservation() {
        console.log("Wanted to save observation with id " + this.props.obsSessionId);
    }

    private handleChange = (event: any, value: number) => {
        this.setState({ activeView: value });
    }

    private handleChangeIndex = (index: number) => {
        this.setState({ activeView: index });
    }

    public render() {
        const { classes } = this.props;

        let observations: IObservation[] = [];
        if (this.state.obsSession && this.state.obsSession.observations) {
            observations = this.state.obsSession.observations;
        }

        if (this.state.obsSession) {
            return (
                <div className={classes.root}>
                    <div>
                        <Typography variant="title">
                            {this.state.obsSession.title}
                        </Typography>
                        <Typography variant="subheading">
                            {this.state.obsSession.date}
                        </Typography>
                    </div>
                    <Tabs
                        value={this.state.activeView}
                        onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        fullWidth={true}
                        centered={true}
                    >
                        <Tab label="Edit session" />
                        <Tab label="View observed objects" />
                    </Tabs>
                    <SwipeableViews
                        axis={"x"}
                        index={this.state.activeView}
                        onChangeIndex={this.handleChangeIndex}
                    >
                        <ObsSessionForm obsSessionId={this.props.obsSessionId} onSaveObservation={this.onSaveObservation} />
                        <ObservationList observations={observations} onSelectObservation={this.onSelectObservation} />
                    </SwipeableViews>
                </div>
            );
        } else {
            return (
                <div>
                    <CircularProgress />
                </div>
            );
        }
    }
}

export default withStyles(styles)(ObsSessionPage);
