import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { IDso, IPagedDsoList } from "../types/Types";
import Api from "../api/Api";
import BadgedDsoWithObservations from "./BadgedDsoWithObservations";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    textfieldPaper: {
        marginTop: theme.spacing.unit * 2,
        padding: theme.spacing.unit * 2,
    },
    textfield: {
        margin: theme.spacing.unit * 1,
        width: "95%"
    },
    badge: {
        top: 20,
        right: -15,
    }
});

interface IObservedDsosProps extends WithStyles<typeof styles> {
    obsSessionId: number;

    // Routing
    match: { params: any };
    location: any;
}

interface IObservedDsosState {
    isLoading: boolean;
    isError: boolean;
    dsoList: IDso[];
}

class ObservedDsos extends React.Component<IObservedDsosProps, IObservedDsosState> {
    constructor(props: IObservedDsosProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            dsoList: [],
        };
    }

    public componentDidMount() {
        this.loadAllObservedDsosFromApi();
    }

    private loadAllObservedDsosFromApi() {
        Api.getAllDsosAndTheirObservations().then(
            (response) => {
                const pagedResult: IPagedDsoList = response.data;
                this.setState({ isLoading: false });
                this.setState({ isError: false });
                this.setState({ dsoList: pagedResult.data });
            }).catch(
                () => {
                    this.setState({ isLoading: false });
                    this.setState({ isError: true });
                }
            );
    }

    public render() {
        const { classes } = this.props;

        let obsList;
        if (this.state.dsoList.length > 0) {
            obsList = this.state.dsoList.map(dso => (
                <Grid item={true} key={dso.id} xs={12}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <BadgedDsoWithObservations dso={dso} showBadge={true} showObservations={true} />
                    </Paper>
                </Grid>
            ));
        }

        if (this.state.isLoading) {
            return (
                <Grid container={true} spacing={40} justify="center" direction="row">
                    <Grid item={true} xs={12} sm={7} justify="center" >
                        <Typography variant="caption" color="textSecondary" gutterBottom={true}>
                            <CircularProgress />
                        </Typography>
                    </Grid>
                </Grid>
            );
        } else if (this.state.isError) {
            return (
                <Typography color="textSecondary" gutterBottom={true}>
                    Error!
                </Typography>
            );
        } else {
            return <div className={classes.root}>
                <Typography variant="title" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                    All observed objects
                </Typography>
                <Grid container={true} spacing={40} justify="center" direction="row">
                    <Grid item={true} xs={12} sm={7}>
                        <Grid container={true} spacing={0} justify="center" direction="column">
                            {obsList}
                        </Grid>
                    </Grid>
                </Grid>
            </div>;
        }
    }
}

export default withStyles(styles)(ObservedDsos);
