import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { IDso, IPagedDsoList } from "../types/Types";
import Api from "../api/Api";
// import DsoExtended from "./DsoExtended";
import DynamicDsoSearchLabel from "./DynamicDsoSearchLabel";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/SearchActions";

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

    // Redux
    store: ReadonlyDataState;
    actions: any;
    dispatch?: any;
}

interface IObservedDsosState {
    isLoading: boolean;
    isError: boolean;
    dsoList: IDso[];
    moreHits: number;
}

class ObservedDsos extends React.Component<IObservedDsosProps, IObservedDsosState> {
    constructor(props: IObservedDsosProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            dsoList: [],
            moreHits: 0
        };
    }

    public componentDidMount() {
        this.loadAllObservedDsosFromApi();
    }

    private loadAllObservedDsosFromApi() {
        Api.getAllDsosAndTheirObservations().then(
            (response) => {
                const pagedResult: IPagedDsoList = response.data;

                this.setState({ moreHits: pagedResult.more });
                this.setState({ dsoList: pagedResult.data });
            }).catch(
                (error) => {
                    this.setState({ isError: true });
                }
            );
    }

    public render() {
        const { classes } = this.props;

        let obsList;
        if (this.state.dsoList.length === 0) {  // No matches
            obsList = (
                <Grid key={-1} item={true} xs={12}>
                    <Typography color="textSecondary" style={{ marginTop: 20 }}>
                        No matches!
                    </Typography>
                </Grid>
            );
        } else {
            obsList = this.state.dsoList.map(dso => (
                <Grid key={dso.id} item={true} xs={12}>
                    <DynamicDsoSearchLabel dso={dso} showBadge={true} showObservations={true} />
                </Grid>
            ));
        }

        return <div className={classes.root}>
            <Typography variant="title" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                All observed objects
            </Typography>
            <Grid container={true} spacing={40} justify="center" direction="row">
                <Grid item={true} xs={12} sm={8}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <Grid container={true} spacing={24} direction="column">
                            {obsList}
                        </Grid>
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

const mapDispatchToProps = (dispatch: Dispatch<actions.SearchAction>) => {
    return {
        actions: bindActionCreators(
            actions,
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ObservedDsos));
// Non-redux way:
//export default withStyles(styles)(ObservedDsos);
