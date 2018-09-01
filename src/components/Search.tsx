import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import * as Autosuggest from "react-autosuggest";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import Api from "../api/Api";
import { IDso } from "./Types";
import { debounce } from "lodash";
import DsoLabel from "./DsoLabel";

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
        classes: {
            input: classes.input,
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
                <DsoLabel dso={suggestion.dso} />
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
        marginTop: theme.spacing.unit,
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
    input: {
        width: 100
    }
});

interface ISearchProps extends WithStyles<typeof styles> {
}

interface ISearchState {
    single: string;
    suggestions: any;
}

class Search extends React.Component<ISearchProps, ISearchState> {
    constructor(props: ISearchProps) {
        super(props);

        this.state = {
            single: "",
            suggestions: [],
        };

        this.loadDsoFromApi = debounce(this.loadDsoFromApi, 300);
    }

    private toSuggestions(dsoList: IDso[]): ISuggestion[] {
        return dsoList.map(dso => ({ dso: dso, altText: undefined }));
    }

    private loadDsoFromApi(query: string) {
        Api.searchDso(query).then(
            (response) => {
                const dsoList = response.data;
                let suggestions: ISuggestion[];
                const maxLength: number = 20;

                if (dsoList.length > maxLength) {
                    const totalLength = dsoList.length;
                    const moreLength = totalLength - maxLength;

                    // Push a truncated suggestions list
                    const truncatedDsoList = dsoList.slice(0, maxLength);
                    suggestions = this.toSuggestions(truncatedDsoList);

                    // Push the 'and more' element
                    const andMoreElem: ISuggestion = {
                        dso: undefined,
                        altText: "... and " + moreLength + " more ..."
                    };
                    suggestions.push(andMoreElem);
                } else {
                    suggestions = this.toSuggestions(dsoList);
                }

                // Push to state
                this.setState({
                    suggestions: suggestions
                });

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
        const { suggestionValue } = params;
        console.log("Suggestionvalue: ");
        console.log(suggestionValue);
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
        console.log("User pressed enter at " + this.state.single);
    }

    public render() {
        const { classes } = this.props;

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

export default withStyles(styles)(Search);
