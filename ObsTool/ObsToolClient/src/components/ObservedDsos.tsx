import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { IDso, IPagedDsoList } from "../types/Types";
import Api from "../api/Api";
import CircularProgress from "@mui/material/CircularProgress";
import DsoBadgedWithObservations from "./DsoBadgedWithObservations";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    textfieldPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
    textfield: {
        margin: theme.spacing(1),
        width: "95%"
    },
    badge: {
        top: 20,
        right: -15,
    }
});

interface IObservedDsosProps extends WithStyles<typeof styles> {
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
                <Grid key={dso.id} size={12}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <DsoBadgedWithObservations dso={dso} showBadge={true} showDsoExtra={true} showObservations={true} startWithObservationsExpanded={false} showPrevAndNextObservation={false} />
                    </Paper>
                </Grid>
            ));
        }

        if (this.state.isLoading) {
            return (
                <Grid container spacing={5} justifyContent="center" direction="row">
                    <Grid size={{ xs: 12, sm: 7 }}>
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
                <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                    All observed objects
                </Typography>
                <Grid container spacing={5} justifyContent="center" direction="row">
                    <Grid size={{ xs: 12, sm: 7 }}>
                        <Grid container spacing={0} justifyContent="center" direction="column">
                            {obsList}
                        </Grid>
                    </Grid>
                </Grid>
            </div>;
        }
    }
}

export default withStyles(styles)(ObservedDsos);
