import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import { IDso, IPagedDsoList } from "../types/Types";
import Api from "../api/Api";
import { debounce } from "lodash";
// import DsoExtended from "./DsoExtended";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/SearchActions";
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

interface ISearchViewProps extends WithStyles<typeof styles> {
    obsSessionId: number;

    // Routing
    match: { params: any };
    location: any;

    // Redux
    store: ReadonlyDataState;
    actions: any;
    dispatch?: any;
}

interface ISearchViewState {
    isLoading: boolean;
    isError: boolean;
    query: string;
    dsoList: IDso[];
    moreHits: number;
}

class SearchView extends React.Component<ISearchViewProps, ISearchViewState> {
    constructor(props: ISearchViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            query: "",
            dsoList: [],
            moreHits: 0
        };

        this.loadDsoFromApi = debounce(this.loadDsoFromApi, 300);
    }

    private receiveAndResetSearchQueryFromRedux(queryFromRedux: string) {
        this.setState({ query: queryFromRedux });
        this.loadDsoFromApi(queryFromRedux);

        // Then clear it in the redux store
        this.props.actions.clearSearch();
    }

    public componentDidMount() {
        this.receiveAndResetSearchQueryFromRedux(this.props.store.searchQuery || "");
    }

    public componentDidUpdate(prevProps: ISearchViewProps) {
        // If as new search query arrived from the redux store
        const newQueryFromRedux = this.props.store.searchQuery;
        if (newQueryFromRedux && newQueryFromRedux !== prevProps.store.searchQuery && newQueryFromRedux !== "") {
            this.receiveAndResetSearchQueryFromRedux(newQueryFromRedux);
        }
    }

    private loadDsoFromApi(query: string) {
        Api.searchDso(this.state.query).then(
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

    private handleChange = (event: any) => {
        const query = event.target.value;
        this.setState({ query: query });
        if (query !== "") {
            this.loadDsoFromApi(query);
        } else {
            this.setState({ dsoList: [] });
        }
    }

    public render() {
        const { classes } = this.props;

        let searchResultPaper;
        if (this.state.query !== "") {
            let searchResult;
            let moreHits;

            if (this.state.moreHits > 0) {
                moreHits = (
                    <Grid key={-1} item={true} xs={12}>
                        <Typography color="textSecondary" style={{ marginTop: 20 }}>
                            ... and {this.state.moreHits} more ...
                        </Typography>
                    </Grid>
                );
            }

            if (this.state.dsoList.length === 0) {  // No matches
                searchResult = (
                    <Grid key={-1} item={true} xs={12}>
                        <Typography color="textSecondary" style={{ marginTop: 20 }}>
                            No matches!
                        </Typography>
                    </Grid>
                );
            } else {
                // Start with observations expanded when there are only 1 match
                const startWithObservationsExpanded = this.state.dsoList.length === 1;
                searchResult = this.state.dsoList.map(dso => (
                    <Grid key={dso.id} item={true} xs={12}>
                        <DsoBadgedWithObservations dso={dso} showBadge={true} showObservations={true} startWithObservationsExpanded={startWithObservationsExpanded} />
                    </Grid>
                ));
            }

            searchResultPaper = (
                <Paper className={classes.textfieldPaper} elevation={1}>
                    <Grid container={true} spacing={3} direction="column">
                        {searchResult}
                    </Grid>
                    {moreHits}
                </Paper>
            );
        }

        return <div className={classes.root}>
            <Grid container={true} spacing={5} justify="center" direction="row">
                <Grid item={true} xs={12} sm={8}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <TextField
                            fullWidth={true}
                            label="Search for an object.."
                            type="search"
                            className={classes.textfield}
                            margin="normal"
                            onChange={this.handleChange}
                        />
                    </Paper>
                    {searchResultPaper}
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

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SearchView));
// Non-redux way:
//export default withStyles(styles)(SearchView);
