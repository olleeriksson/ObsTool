import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Api from "../api/Api";
import { IDso, IPagedDsoList } from "../types/Types";
import { debounce } from "lodash";
import { Navigate } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, ReadonlyDataState } from "../types/Types";
import * as actions from "../actions/SearchActions";
import DsoBadgedWithObservations from "./DsoBadgedWithObservations";

interface ISuggestion {
    dso?: IDso;
    altText?: string;
}

const styles = (_theme: Theme) => createStyles({
    root: {
        flexGrow: 1,
    },
});

interface ISearchInputProps extends WithStyles<typeof styles> {
    onSearchView?: boolean;
    store: ReadonlyDataState;
    actions: any;
    dispatch?: any;
}

interface ISearchInputState {
    inputValue: string;
    options: ISuggestion[];
    redirectToSearchPage: boolean;
}

class SearchInput extends React.Component<ISearchInputProps, ISearchInputState> {
    constructor(props: ISearchInputProps) {
        super(props);

        this.state = {
            inputValue: "",
            options: [],
            redirectToSearchPage: false
        };
    }

    private loadDsoFromApi = debounce((query: string) => {
        Api.searchDso(query).then(
            (response) => {
                const pagedResult: IPagedDsoList = response.data;
                const options: ISuggestion[] = pagedResult.data.map(dso => ({ dso }));
                if (pagedResult.more > 0) {
                    options.push({ altText: "... and " + pagedResult.more + " more ..." });
                }
                this.setState({ options });
            }).catch((error) => {
                this.setState({ options: [{ altText: String(error) }] });
            });
    }, 300);

    private handleInputChange = (_event: any, newValue: string, reason: string) => {
        this.setState({ inputValue: newValue });
        if (reason === "input") {
            if (newValue) {
                this.loadDsoFromApi(newValue);
            } else {
                this.setState({ options: [] });
            }
        }
    }

    private handleOptionSelected = (_event: any, value: ISuggestion | string | null) => {
        if (value && typeof value !== "string" && value.dso) {
            this.props.actions.search(value.dso.name);
            this.setState({ redirectToSearchPage: true });
        }
    }

    private onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        this.props.actions.search(this.state.inputValue);
        this.setState({ redirectToSearchPage: true });
    }

    public render() {
        const { classes } = this.props;

        if (this.state.redirectToSearchPage && !this.props.onSearchView) {
            return <Navigate to="/search" replace />;
        }

        return (
            <div className={classes.root}>
                <form onSubmit={this.onFormSubmit}>
                    <Autocomplete<ISuggestion, false, false, true>
                        freeSolo
                        options={this.state.options}
                        getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option.dso ? option.dso.name : (option.altText ?? "");
                        }}
                        getOptionKey={(option) => {
                            if (typeof option === "string") return option;
                            return option.dso ? `dso-${option.dso.id}` : `alt-${option.altText ?? ""}`;
                        }}
                        filterOptions={(x) => x}
                        inputValue={this.state.inputValue}
                        onInputChange={this.handleInputChange}
                        onChange={this.handleOptionSelected}
                        renderOption={(props, option) => {
                            const { key, ...restProps } = props as any;
                            if (option.dso) {
                                return (
                                    <li key={key} {...restProps}>
                                        <DsoBadgedWithObservations dso={option.dso} showBadge={true} showDsoExtra={false} showObservations={false} startWithObservationsExpanded={false} />
                                    </li>
                                );
                            }
                            return (
                                <li key={key} {...restProps}>
                                    <strong style={{ fontWeight: 300 }}>{option.altText}</strong>
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search for an object.."
                            />
                        )}
                        slotProps={{
                            popper: {
                                placement: "bottom-start",
                                style: { width: 500 },
                            },
                        }}
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
