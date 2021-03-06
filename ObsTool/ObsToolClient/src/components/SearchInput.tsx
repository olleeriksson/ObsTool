import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import * as Autosuggest from "react-autosuggest";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import Api from "../api/Api";
import { IDso, IPagedDsoList } from "../types/Types";
import { debounce } from "lodash";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/SearchActions";
import DsoBadgedWithObservations from "./DsoBadgedWithObservations";

// #########################################################
// Read more about Autosuggest here:
//    https://github.com/moroshko/react-autosuggest
// #########################################################

interface ISuggestion {
    dso?: IDso;
    altText?: string;
}

function renderInputComponent(inputProps: any) {
    const { classes, inputRef = () => { }, ref, ...other } = inputProps;

    const inputPropsObj = {
        inputRef: (node: any) => {
            ref(node);
            inputRef(node);
        },
    };

    return (
        <TextField
            fullWidth={true}
            InputProps={inputPropsObj}
            {...other}
        />
    );
}

function renderSuggestion(suggestion: ISuggestion, param: Autosuggest.RenderSuggestionParams) {
    const { isHighlighted } = param;
    if (suggestion.dso) {
        return (
            <MenuItem selected={isHighlighted} component="div">
                <DsoBadgedWithObservations dso={suggestion.dso} showBadge={true} showObservations={false} startWithObservationsExpanded={false} />
            </MenuItem>
        );
    } else {
        return <MenuItem selected={isHighlighted} component="div">
            <div>
                <strong style={{ fontWeight: 300 }}>
                    {suggestion.altText}
                </strong>
            </div>
        </MenuItem>;
    }
}

function getSuggestionValue(suggestion: ISuggestion) {
    return suggestion.dso ? suggestion.dso.name.toString() : "";
}

const styles = (theme: Theme) => createStyles({
    root: {
        flexGrow: 1,
    },
    container: {
        position: "relative",
    },
    suggestionsContainerOpen: {
        position: "absolute",
        zIndex: 1,
        marginTop: theme.spacing(1),
        left: 0,
        right: 0,
    },
    suggestion: {
        display: "block",
    },
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: "none",
    },
});

interface ISearchInputProps extends WithStyles<typeof styles> {
    onSearchView?: boolean;  // hack since I can't get hold of react-router-dom's location parameter it seems
    store: ReadonlyDataState;
    actions: any;
    dispatch?: any;
}

interface ISearchInputState {
    single: string;
    suggestions: any;
    redirectToSearchPage: boolean;
}

class SearchInput extends React.Component<ISearchInputProps, ISearchInputState> {
    constructor(props: ISearchInputProps) {
        super(props);

        this.state = {
            single: "",
            suggestions: [],
            redirectToSearchPage: false
        };

        this.loadDsoFromApi = debounce(this.loadDsoFromApi, 300);
    }

    private toSuggestions(dsoList: IDso[]): ISuggestion[] {
        return dsoList.map(dso => ({ dso: dso, altText: undefined }));
    }

    private loadDsoFromApi(query: string) {
        Api.searchDso(query).then(
            (response) => {
                const pagedResult: IPagedDsoList = response.data;

                const dsoList = pagedResult.data;
                const suggestions = this.toSuggestions(dsoList);

                // Push the 'and more' element if the list has been truncated
                if (pagedResult.more > 0) {
                    const andMoreElem: ISuggestion = {
                        dso: undefined,
                        altText: "... and " + pagedResult.more + " more ..."
                    };
                    suggestions.push(andMoreElem);
                }

                // Push to state
                this.setState({ suggestions: suggestions });

            }).catch(
                (error) => {
                    const errorElem: ISuggestion = {
                        dso: undefined,
                        altText: error
                    };

                    // Push a single error element to as the list of suggestions on the state
                    this.setState({
                        suggestions: [errorElem]
                    });
                }
            );
    }

    private handleSuggestionsFetchRequested = (param: any) => {
        const query = param.value;
        this.loadDsoFromApi(query);
    }

    private handleSuggestionsClearRequested = () => {
        this.setState({
            suggestions: [],
        });
    }

    private onSuggestionSelected = (event: any, params: Autosuggest.SuggestionSelectedEventData<ISuggestion>) => {
        this.props.actions.search(params.suggestionValue);
        this.setState({ redirectToSearchPage: true });
    }

    private onSuggestionHighlighted = (param: Autosuggest.SuggestionHighlightedParams) => {
        if (param.suggestion && param.suggestion.dso) {
            console.log(param.suggestion.dso.name);
            this.setState({
                single: param.suggestion.dso.name
            });
        }
    }

    // When the input field changes by the user typing
    private handleChange = (event: any) => {
        this.setState({
            single: event.target.value
        });
    }

    private onFormSubmit = (e: any) => {
        e.preventDefault();
        // Clicking without actively selecting a suggestion also redirects
        this.props.actions.search(this.state.single);
        this.setState({ redirectToSearchPage: true });
    }

    public render() {
        const { classes } = this.props;

        // Redirects
        //-----------------------------------
        if (this.state.redirectToSearchPage && !this.props.onSearchView) {
            return <Redirect to="/search" />;
        }

        const autosuggestProps = {
            renderInputComponent,
            suggestions: this.state.suggestions,
            onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
            onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
            onSuggestionSelected: this.onSuggestionSelected,
            onSuggestionHighlighted: this.onSuggestionHighlighted,
            getSuggestionValue,
            renderSuggestion,
        };

        const inputProps = {
            classes,
            placeholder: "Search for an object..",
            value: this.state.single,
            onChange: this.handleChange,
        };

        const theme = {
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion,
        };

        const renderSuggestionContainer = (options: any) => (
            <Paper {...options.containerProps} square={true}>
                {options.children}
            </Paper>
        );

        return (
            <div className={classes.root}>
                <form onSubmit={this.onFormSubmit}>
                    <Autosuggest
                        {...autosuggestProps}
                        inputProps={inputProps}
                        theme={theme}
                        renderSuggestionsContainer={renderSuggestionContainer}
                    />
                </form>
            </div>
        );
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

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SearchInput));
// Non-redux way:
//export default withStyles(styles)(SearchInput);
