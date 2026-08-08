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
import DsoCard from "./DsoCard";

interface ISuggestion {
    dso?: IDso;
    altText?: string;
}

const styles = (theme: Theme) => createStyles({
    root: {
        flexGrow: 1,
    },
    paper: {
        overflow: "visible",
    },
    listbox: {
        maxHeight: "none",
        overflowY: "visible",
        paddingBottom: 0,
        paddingTop: 0,
    },
    option: {
        alignItems: "center !important",
        minHeight: 58,
        overflow: "visible !important",
        paddingBottom: "8px !important",
        paddingTop: "8px !important",
        "& .MuiBadge-root": {
            overflow: "visible",
        },
    },
    moreOption: {
        color: theme.palette.text.secondary,
        fontStyle: "italic",
        minHeight: 42,
    },
    navBarContrastField: {
        "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            color: theme.palette.common.white,
            "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.36)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.72)",
            },
            "&.Mui-focused fieldset": {
                borderColor: theme.palette.common.white,
            },
        },
        "& .MuiInputBase-input::placeholder": {
            color: theme.palette.common.white,
            opacity: 0.76,
        },
        "& .MuiSvgIcon-root": {
            color: theme.palette.common.white,
        },
    },
});

const maxVisibleDsoSuggestions = 12;

interface ISearchInputProps extends WithStyles<typeof styles> {
    navBarContrast?: boolean;
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

export class SearchInput extends React.Component<ISearchInputProps, ISearchInputState> {
    private activeSearchController?: AbortController;
    private latestSearchQuery = "";
    private latestSearchRequestId = 0;

    constructor(props: ISearchInputProps) {
        super(props);

        this.state = {
            inputValue: "",
            options: [],
            redirectToSearchPage: false
        };
    }

    private loadDsoFromApi = debounce((query: string) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery === "") {
            this.setState({ options: [] });
            return;
        }

        const requestId = ++this.latestSearchRequestId;
        const controller = new AbortController();
        this.activeSearchController = controller;

        Api.searchDso(trimmedQuery, false, controller.signal).then(
            (response) => {
                if (requestId !== this.latestSearchRequestId || trimmedQuery !== this.latestSearchQuery) {
                    return;
                }
                const pagedResult: IPagedDsoList = response.data;
                const visibleDsos = pagedResult.data.slice(0, maxVisibleDsoSuggestions);
                const hiddenCurrentPageDsos = Math.max(0, pagedResult.data.length - visibleDsos.length);
                const options: ISuggestion[] = visibleDsos.map(dso => ({ dso }));
                if (pagedResult.more + hiddenCurrentPageDsos > 0) {
                    options.push({ altText: "... and " + (pagedResult.more + hiddenCurrentPageDsos) + " more ..." });
                }
                this.setState({ options });
            }).catch((error) => {
                if (this.isCanceledSearchError(error) || requestId !== this.latestSearchRequestId) {
                    return;
                }
                this.setState({ options: [{ altText: String(error) }] });
            }).finally(() => {
                if (this.activeSearchController === controller) {
                    this.activeSearchController = undefined;
                }
            });
    }, 300);

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

    private handleInputChange = (_event: any, newValue: string, reason: string) => {
        this.setState({ inputValue: newValue });
        if (reason === "input") {
            const trimmedQuery = newValue.trim();
            this.latestSearchQuery = trimmedQuery;
            this.cancelActiveSearchRequest();
            if (newValue.trim() !== "") {
                this.loadDsoFromApi(newValue);
            } else {
                this.loadDsoFromApi.cancel();
                this.setState({ options: [] });
            }
        }
    }

    private handleOptionSelected = (_event: any, value: ISuggestion | string | null) => {
        if (value && typeof value !== "string" && value.dso) {
            // Preserve the selected object's stable key so the search page can request only that object.
            this.props.actions.search(value.dso.name, value.dso.objectKey || `Sac:${value.dso.id}`);
            this.setState({ redirectToSearchPage: true });
        }
    }

    private onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = this.state.inputValue.trim();
        if (trimmedQuery === "") {
            return;
        }

        this.props.actions.search(trimmedQuery);
        this.setState({ redirectToSearchPage: true });
    }

    public componentDidUpdate(prevProps: ISearchInputProps) {
        // Once we've arrived on the search page, clear the redirect flag so that
        // navigating away later doesn't immediately bounce back to /search.
        if (!prevProps.onSearchView && this.props.onSearchView && this.state.redirectToSearchPage) {
            this.setState({ redirectToSearchPage: false });
        }
    }

    public componentWillUnmount() {
        this.loadDsoFromApi.cancel();
        this.cancelActiveSearchRequest();
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
                            return option.dso ? (option.dso.objectKey || `Sac:${option.dso.id}`) : `alt-${option.altText ?? ""}`;
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
                                        <DsoCard dso={option.dso} showBadge={true} showDsoExtra={false} showObservations={false} startWithObservationsExpanded={false} showPrevAndNextObservation={true} dsoTypeIconSize={28} />
                                    </li>
                                );
                            }
                            return (
                                <li key={key} {...restProps} className={`${restProps.className || ""} ${classes.moreOption}`}>
                                    <strong style={{ fontWeight: 300 }}>{option.altText}</strong>
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                className={this.props.navBarContrast ? classes.navBarContrastField : undefined}
                                size="small"
                                placeholder="Search for an object.."
                            />
                        )}
                        slotProps={{
                            listbox: {
                                className: classes.listbox,
                            },
                            paper: {
                                className: classes.paper,
                            },
                            popper: {
                                placement: "bottom-start",
                                style: { width: 500 },
                            },
                        }}
                        classes={{
                            option: classes.option,
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
