import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import { IDso } from "./Types";
import Api from "../api/Api";
import { debounce } from "lodash";
// import DsoExtended from "./DsoExtended";
import DsoLabel from "./DsoLabel";

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
});

interface ISearchViewProps extends WithStyles<typeof styles> {
    obsSessionId: number;
    match: { params: any };
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

    public componentDidMount() {
    }

    private loadDsoFromApi(query: string) {
        Api.searchDso(query).then(
            (response) => {
                const dsoList = response.data;
                const maxLength: number = 10;

                const totalLength = dsoList.length;

                const moreHits = totalLength > maxLength ? totalLength - maxLength : 0;
                this.setState({ moreHits: moreHits });

                // Push a truncated suggestions list
                const truncatedDsoList = dsoList.slice(0, maxLength);

                // Push to state
                this.setState({
                    dsoList: truncatedDsoList
                });

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

            if (this.state.dsoList.length > 0) {
                searchResult = this.state.dsoList.map(dso => (
                    <Grid key={dso.id} item={true} xs={12}>
                        <DsoLabel dso={dso} />
                        {/* <DsoExtended dso={dso} /> */}
                    </Grid>
                ));
            } else {
                searchResult = (
                    <Grid key={-1} item={true} xs={12}>
                        <Typography color="textSecondary" style={{ marginTop: 20 }}>
                            No matches!
                        </Typography>
                    </Grid>
                );
            }

            searchResultPaper = (
                <Paper className={classes.textfieldPaper} elevation={1}>
                    <Grid container={true} spacing={24} direction="column">
                        {searchResult}
                    </Grid>
                    {moreHits}
                </Paper>
            );
        }

        return <div className={classes.root}>
            <Grid container={true} spacing={40} justify="center" direction="row">
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

export default withStyles(styles)(SearchView);
