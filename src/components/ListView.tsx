import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import "./Layout.css";
import axios from "axios";
import { IObsSession } from "./Types";
import ObsSessionList from "./ObsSessionList";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing.unit * 3,
    },
    header: {
    },
});

export interface IListView extends WithStyles<typeof styles> {
    children?: React.ReactNode;
}

export interface IListViewState {
    isLoading: boolean;
    isError: boolean;
    selectedObsSessionId?: number;
    obsSessions?: IObsSession[];
}

class ListView extends React.Component<IListView, IListViewState> {
    constructor(props: IListView) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            selectedObsSessionId: undefined,
            obsSessions: undefined,
        };
    }

    public componentDidMount() {
        this.loadData();
    }

    private loadData() {
        axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ obsSessions: data });
                this.setState({ isLoading: false });
                this.setState({ isError: false });
            },
            () => {
                this.setState({ isLoading: false });
                this.setState({ isError: true });
            }
        );
    }

    public onSelectObsSession(obsSessionId: number) {
        if (this.state.obsSessions) {
            const selectedObsSession = this.state.obsSessions.find(s => s.id === obsSessionId);
            if (selectedObsSession) {
                this.setState({ selectedObsSessionId: selectedObsSession.id });
                console.log("Selected a new obs session with id " + selectedObsSession.id);
            }
            console.log("Clicked on obs session " + obsSessionId);

            // TODO: Filter the right hand side list!!
        }
    }

    public render() {
        const { classes } = this.props;

        return <div className={classes.root}>
            <Grid container={true} spacing={40} alignItems="flex-start">
                <Grid item={true} xs={12} sm={12} md={5} className={classes.header}>
                    <Typography variant="title" align="left" color="textPrimary" component="p">
                        <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" /> Sessions
                    </Typography>

                    <ObsSessionList obsSessions={this.state.obsSessions || []} onSelectObsSession={this.onSelectObsSession} />

                </Grid>
                <Grid item={true} xs={12} sm={12} md={7}>
                    <Typography variant="title" align="left" color="textPrimary" component="p">
                        <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" /> Observations
                    </Typography>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(ListView);
