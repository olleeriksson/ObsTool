import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { IDso, IPagedDsoList } from "../types/Types";
import Api from "../api/Api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { debounce } from "lodash";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/SearchActions";
import DsoCard from "./DsoCard";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    textfieldPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(3),
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
    store: ReadonlyDataState;
    actions: any;
}

interface ISearchViewState {
    isLoading: boolean;
    isError: boolean;
    query: string;
    dsoList: IDso[];
    moreHits: number;
}

/*
This component is used to render the search page. It has a search input field and the results are a list
of rendered DsoCard components.
 */
export class SearchView extends React.Component<ISearchViewProps, ISearchViewState> {
    private activeSearchController?: AbortController;
    private latestSearchQuery = "";
    private latestSearchRequestId = 0;

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
        const trimmedQuery = queryFromRedux.trim();
        this.latestSearchQuery = trimmedQuery;
        this.cancelActiveSearchRequest();
        this.setState({ query: trimmedQuery });
        if (trimmedQuery !== "") {
            this.loadDsoFromApi(trimmedQuery);
        }

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

    public componentWillUnmount() {
        (this.loadDsoFromApi as any).cancel?.();
        this.cancelActiveSearchRequest();
    }

    private loadDsoFromApi(query: string) {
        const trimmedQuery = query.trim();
        if (trimmedQuery === "") {
            this.setState({ dsoList: [], moreHits: 0, isError: false });
            return;
        }

        const requestId = ++this.latestSearchRequestId;
        const controller = new AbortController();
        this.activeSearchController = controller;
        this.setState({ isLoading: true, isError: false });

        Api.searchDso(trimmedQuery, true, controller.signal).then(
            (response) => {
                if (requestId !== this.latestSearchRequestId || trimmedQuery !== this.latestSearchQuery) {
                    return;
                }
                const pagedResult: IPagedDsoList = response.data;

                this.setState({ moreHits: pagedResult.more, dsoList: pagedResult.data });
            }).catch(
                (error) => {
                    if (this.isCanceledSearchError(error) || requestId !== this.latestSearchRequestId) {
                        return;
                    }
                    this.setState({ isError: true });
                }
            ).finally(() => {
                if (this.activeSearchController === controller) {
                    this.activeSearchController = undefined;
                }
                if (requestId === this.latestSearchRequestId) {
                    this.setState({ isLoading: false });
                }
            });
    }

    private cancelActiveSearchRequest = () => {
        this.latestSearchRequestId++;
        if (this.activeSearchController) {
            this.activeSearchController.abort();
            this.activeSearchController = undefined;
        }
    }

    private isCanceledSearchError = (error: any) => {
        return error?.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.name === "AbortError";
    }

    private handleChange = (event: any) => {
        const query = event.target.value;
        const trimmedQuery = query.trim();
        this.latestSearchQuery = trimmedQuery;
        this.cancelActiveSearchRequest();
        this.setState({ query: query });
        if (trimmedQuery !== "") {
            this.loadDsoFromApi(trimmedQuery);
        } else {
            (this.loadDsoFromApi as any).cancel?.();
            this.setState({ dsoList: [], moreHits: 0, isError: false });
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
                    <Grid key={-1} size={12}>
                        <Typography color="textSecondary" style={{ marginTop: 20 }}>
                            ... and {this.state.moreHits} more ...
                        </Typography>
                    </Grid>
                );
            }

            if (this.state.dsoList.length === 0) {  // No matches
                searchResult = (
                    <Grid key={-1} size={12}>
                        <Typography color="textSecondary" style={{ marginTop: 20 }}>
                            No matches!
                        </Typography>
                    </Grid>
                );
            } else {
                // Start with observations expanded when there are only 1 match
                const startWithObservationsExpanded = this.state.dsoList.length === 1;
                searchResult = this.state.dsoList.map(dso => (
                    <Grid key={dso.objectKey || `Sac:${dso.id}`} size={12}>
                        <DsoCard dso={dso} showBadge={true} showDsoExtra={true} showObservations={true} startWithObservationsExpanded={startWithObservationsExpanded} showPrevAndNextObservation={true} />
                    </Grid>
                ));
            }

            searchResultPaper = (
                <Paper className={classes.textfieldPaper} elevation={1}>
                    <Grid container spacing={3} direction="column" >
                        {searchResult}
                    </Grid>
                    {moreHits}
                </Paper>
            );
        }

        return <div className={classes.root}>
            <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                <FontAwesomeIcon icon="search" className="faSpaceAfter" /> Search
            </Typography>
            <Grid container spacing={5} justifyContent="center" direction="row">
                <Grid size={{ xs: 12, sm: 8 }}>
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
