import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import Api from "../api/Api";
import { IAppState, IConstellationOption, IDataState, IDso, IObservedObject, IUserObjectForSave } from "../types/Types";
import { connect } from "react-redux";
import { getDsoTypeAbbreviation, getDsoTypeOptions, resolveDsoTypeCode, translateDsoType } from "../utils/objectTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { DsoTypeIcon } from "./DsoTypeIcon";
import DeleteDialog from "./DeleteDialog";

const SAC_OBJECT_TYPE_OPTIONS = getDsoTypeOptions().map(option => option.code);
const UNSPECIFIED_CONSTELLATION_OPTION: IConstellationOption = { name: "Unspecified", abbreviation: "" };
const TYPE_ICON_PREVIEW_EXPANDED_STORAGE_KEY = "obstool.objectsView.typeIconPreviewExpanded";

interface ITypeOptionCandidate {
    modifiedDate?: string | null;
    value: string;
}

type ObjectTableKey = "user" | "other";
type ObjectTableSortColumn = "name" | "type" | "constellation" | "mag" | "references" | "modified";
type ObjectTableSortDirection = "asc" | "desc";

interface IObjectTableSortState {
    column?: ObjectTableSortColumn;
    direction: ObjectTableSortDirection;
}

const styles = (theme: Theme) => createStyles({
    root: {
    },
    panel: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(1.5),
    },
    formGrid: {
        display: "grid",
        columnGap: theme.spacing(1.5),
        rowGap: theme.spacing(0.75),
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        [theme.breakpoints.down("sm")]: {
            gridTemplateColumns: "1fr",
        },
    },
    thirdRowField: {
        gridColumn: "span 4",
        [theme.breakpoints.down("sm")]: {
            gridColumn: "1",
        },
    },
    halfRowField: {
        gridColumn: "span 6",
        [theme.breakpoints.down("sm")]: {
            gridColumn: "1",
        },
    },
    quarterRowField: {
        gridColumn: "span 3",
        [theme.breakpoints.down("sm")]: {
            gridColumn: "1",
        },
    },
    fullWidthField: {
        gridColumn: "1 / -1",
    },
    actionRow: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(1),
        marginTop: theme.spacing(2),
    },
    tableWrapper: {
        overflowX: "auto",
    },
    nameCell: {
        minWidth: 170,
        paddingBottom: theme.spacing(0.75),
        paddingTop: theme.spacing(0.75),
    },
    nameInputText: {
        fontWeight: 600,
    },
    objectName: {
        fontWeight: 600,
    },
    disabledNameInputText: {
        color: theme.palette.text.secondary,
        cursor: "not-allowed",
        WebkitTextFillColor: theme.palette.text.secondary,
    },
    metadataCell: {
        minWidth: 200,
        paddingBottom: theme.spacing(0.75),
        paddingTop: theme.spacing(0.75),
    },
    formHeading: {
        alignItems: "baseline",
        display: "flex",
        gap: theme.spacing(1),
        justifyContent: "space-between",
        width: "100%",
    },
    objectTableHeader: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(2),
        justifyContent: "space-between",
        marginBottom: theme.spacing(1),
        [theme.breakpoints.down("sm")]: {
            alignItems: "stretch",
            flexDirection: "column",
            gap: theme.spacing(0.5),
        },
    },
    objectTableSearch: {
        flex: "0 1 280px",
        marginLeft: "auto",
        [theme.breakpoints.down("sm")]: {
            flex: "1 1 auto",
            marginLeft: 0,
        },
    },
    typePreviewToggle: {
        marginLeft: "auto",
    },
    typePreviewToggleIcon: {
        transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
        }),
    },
    typePreviewToggleIconOpen: {
        transform: "rotate(180deg)",
    },
    tableCell: {
        paddingBottom: theme.spacing(0.75),
        paddingTop: theme.spacing(0.75),
    },
    referenceLinks: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(0.75),
    },
    typeInputAdornment: {
        marginRight: theme.spacing(0.25),
    },
    typeOptionContent: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(1),
        minHeight: 28,
        width: "100%",
    },
    typeOptionIcon: {
        flex: "0 0 auto",
    },
    typePreviewLabel: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(1),
        minWidth: 240,
    },
    typePreviewList: {
        display: "grid",
        gap: theme.spacing(0.75),
        marginBottom: theme.spacing(1.5),
        paddingTop: theme.spacing(0.5),
    },
    typePreviewSectionTitle: {
        marginTop: theme.spacing(1),
        "&:first-of-type": {
            marginTop: 0,
        },
    },
    typePreviewRow: {
        alignItems: "center",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        display: "flex",
        gap: theme.spacing(2),
        justifyContent: "flex-start",
        minHeight: 36,
        padding: theme.spacing(0),
        [theme.breakpoints.down("sm")]: {
            alignItems: "flex-start",
            flexDirection: "column",
            gap: theme.spacing(0.75),
        },
    },
    actionCell: {
        paddingBottom: theme.spacing(0.5),
        paddingTop: theme.spacing(0.5),
        whiteSpace: "nowrap",
        width: 96,
    },
});

interface IObjectsViewProps extends WithStyles<typeof styles> {
    store: IDataState;
}

interface IObjectsViewState {
    isLoading: boolean;
    isSaving: boolean;
    isError: boolean;
    errorMessage?: string;
    userObjects: IObservedObject[];
    otherObjects: IObservedObject[];
    constellations: IConstellationOption[];
    canCreateOtherObjects: boolean;
    saveAsUserObject: boolean;
    userObjectSearchText: string;
    otherObjectSearchText: string;
    userObjectSort: IObjectTableSortState;
    otherObjectSort: IObjectTableSortState;
    isTypeIconPreviewExpanded: boolean;
    currentObject: IObservedObject;
    similarSacObjects: IDso[];
    isCheckingSimilar: boolean;
    deleteCandidate?: IObservedObject;
}

export class ObjectsView extends React.Component<IObjectsViewProps, IObjectsViewState> {
    constructor(props: IObjectsViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isSaving: false,
            isError: false,
            userObjects: [],
            otherObjects: [],
            constellations: [],
            canCreateOtherObjects: false,
            saveAsUserObject: true,
            userObjectSearchText: "",
            otherObjectSearchText: "",
            userObjectSort: { column: "modified", direction: "desc" },
            otherObjectSort: { column: "modified", direction: "desc" },
            isTypeIconPreviewExpanded: this.readTypeIconPreviewExpandedPreference(),
            currentObject: this.getEmptyObject(),
            similarSacObjects: [],
            isCheckingSimilar: false,
        };
    }

    public componentDidMount() {
        this.loadObjectsFromApi();
    }

    // Builds the empty editable form object used when adding a new object, optionally retaining the last saved type.
    private getEmptyObject = (type: string = ""): IObservedObject => ({
        id: undefined,
        name: "",
        otherNames: "",
        commonName: "",
        allCommonNames: "",
        notes: "",
        type,
        const: "",
        ra: "",
        dec: "",
        mag: "",
    });

    // Loads user and shared object lists together so reference counts stay consistent after edits.
    private loadObjectsFromApi = (preservedType: string = "") => {
        this.setState({ isLoading: true, isError: false, errorMessage: undefined });
        Api.getObjects().then(response => {
            this.setState(prevState => ({
                isLoading: false,
                userObjects: response.data.userObjects || [],
                otherObjects: response.data.otherObjects || [],
                constellations: response.data.constellations || [],
            canCreateOtherObjects: !!response.data.canCreateOtherObjects,
            saveAsUserObject: prevState.saveAsUserObject,
            userObjectSearchText: prevState.userObjectSearchText,
            otherObjectSearchText: prevState.otherObjectSearchText,
            userObjectSort: prevState.userObjectSort,
            otherObjectSort: prevState.otherObjectSort,
            isTypeIconPreviewExpanded: prevState.isTypeIconPreviewExpanded,
            currentObject: this.getEmptyObject(preservedType),
            similarSacObjects: [],
                isCheckingSimilar: false,
            }));
        }).catch(() => {
            this.setState({ isLoading: false, isError: true, errorMessage: "Failed to load objects." });
        });
    }

    // Updates one table's local search string without affecting the other object table.
    private handleObjectSearchChange = (tableKey: ObjectTableKey) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const stateKey = tableKey === "user" ? "userObjectSearchText" : "otherObjectSearchText";
        this.setState({ [stateKey]: value } as Pick<IObjectsViewState, "userObjectSearchText" | "otherObjectSearchText">);
    }

    // Changes a table sort column, toggling direction when the current sorted column is clicked again.
    private handleObjectSortChange = (tableKey: ObjectTableKey, column: ObjectTableSortColumn) => () => {
        const stateKey = tableKey === "user" ? "userObjectSort" : "otherObjectSort";
        this.setState(prevState => {
            const currentSort = prevState[stateKey];
            const direction = currentSort.column === column && currentSort.direction === "asc" ? "desc" : "asc";

            return {
                [stateKey]: {
                    column,
                    direction,
                },
            } as Pick<IObjectsViewState, "userObjectSort" | "otherObjectSort">;
        });
    }

    // Updates one form field without mutating the current object reference.
    private handleFormChange = (name: keyof IObservedObject) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        this.setState(prevState => ({
            currentObject: {
                ...prevState.currentObject,
                [name]: value,
            },
            similarSacObjects: name === "name" ? [] : prevState.similarSacObjects,
            isError: false,
            errorMessage: undefined,
        }));
    }

    // Updates the free-text Type dropdown while preserving existing custom type casing on exact matches.
    private handleTypeInputChange = (_event: React.SyntheticEvent, value: string, reason: string) => {
        if (reason !== "input" && reason !== "clear") {
            return;
        }

        this.setState(prevState => ({
            currentObject: {
                ...prevState.currentObject,
                type: reason === "clear" ? "" : this.resolveObjectTypeOption(value),
            },
            isError: false,
            errorMessage: undefined,
        }));
    }

    // Stores the canonical type value when a known dropdown option is chosen.
    private handleTypeChange = (_event: React.SyntheticEvent, value: string | null) => {
        this.setState(prevState => ({
            currentObject: {
                ...prevState.currentObject,
                type: value ? this.resolveObjectTypeOption(value) : "",
            },
            isError: false,
            errorMessage: undefined,
        }));
    }

    // Stores uppercase constellation abbreviations so custom objects match existing SAC display conventions.
    private handleConstellationChange = (_event: React.SyntheticEvent, value: IConstellationOption | null) => {
        this.setState(prevState => ({
            currentObject: {
                ...prevState.currentObject,
                const: value?.abbreviation ? value.abbreviation.toUpperCase() : "",
            },
            isError: false,
            errorMessage: undefined,
        }));
    }

    // Toggles whether a privileged new-object save goes to UserObjects or OtherObjects.
    private handleSaveAsUserObjectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            saveAsUserObject: event.target.checked,
            isError: false,
            errorMessage: undefined,
        });
    }

    // Performs the final SAC identity check after local duplicate checks and before any create request.
    private checkSacConflictBeforeCreate = (name: string) => {
        this.setState({ similarSacObjects: [], isCheckingSimilar: true });
        return Api.searchDso(name, false).then(response => {
            const exactMatches = (response.data.data || [])
                .filter(dso => this.isExactSacCatalogIdentityMatch(name, dso))
                .slice(0, 5);

            this.setState({
                isCheckingSimilar: false,
                similarSacObjects: exactMatches,
            });

            return exactMatches;
        }).catch(() => {
            this.setState({ isCheckingSimilar: false, similarSacObjects: [] });
            throw new Error("Failed to verify the object name before saving.");
        });
    }

    // Converts the editable form state to the API shape used for create and update calls.
    private getSavePayload = (): IUserObjectForSave => {
        const current = this.state.currentObject;
        return {
            name: (current.name || "").trim(),
            otherNames: current.otherNames || "",
            commonName: current.commonName || "",
            allCommonNames: current.allCommonNames || "",
            notes: current.notes || "",
            type: current.type ? resolveDsoTypeCode(current.type) : "",
            const: current.const ? current.const.toUpperCase() : "",
            ra: current.ra || "",
            dec: current.dec || "",
            mag: current.mag || "",
        };
    }

    // Validates the only required editable field before sending data to the API.
    private isCurrentObjectValid = () => {
        return (this.state.currentObject.name || "").trim().length > 0;
    }

    // Finds a same-user object whose stable Name identifier already matches the add form.
    private getDuplicateUserObjectName = () => {
        if (this.state.currentObject.id) {
            return undefined;
        }

        const normalizedName = this.normalizeFreeText(this.state.currentObject.name || "");
        if (!normalizedName) {
            return undefined;
        }

        const existingObject = this.state.userObjects.find(userObject =>
            this.normalizeFreeText(userObject.name || "") === normalizedName);
        return existingObject?.name;
    }

    // Finds a same-name shared object when a privileged user is adding an Other object.
    private getDuplicateOtherObjectName = () => {
        if (this.state.currentObject.id) {
            return undefined;
        }

        const normalizedName = this.normalizeFreeText(this.state.currentObject.name || "");
        if (!normalizedName) {
            return undefined;
        }

        const existingObject = this.state.otherObjects.find(otherObject =>
            this.normalizeFreeText(otherObject.name || "") === normalizedName);
        return existingObject?.name;
    }

    // Applies duplicate-name checks for the table being saved, including shared names before user-object creation.
    private getDuplicateCurrentObjectConflict = () => {
        if (this.state.saveAsUserObject) {
            const duplicateUserObjectName = this.getDuplicateUserObjectName();
            if (duplicateUserObjectName) {
                return { name: duplicateUserObjectName, label: "user object" };
            }

            const duplicateOtherObjectName = this.getDuplicateOtherObjectName();
            if (duplicateOtherObjectName) {
                return { name: duplicateOtherObjectName, label: "other object" };
            }

            return undefined;
        }

        const duplicateOtherObjectName = this.getDuplicateOtherObjectName();
        return duplicateOtherObjectName
            ? { name: duplicateOtherObjectName, label: "other object" }
            : undefined;
    }

    // Builds the duplicate-name error message with the backend's user/other wording.
    private formatDuplicateObjectMessage = (duplicateObject: { name: string; label: string }) => {
        const article = duplicateObject.label === "other object" ? "An" : "A";
        return `${article} ${duplicateObject.label} named '${duplicateObject.name}' already exists.`;
    }

    // Normalizes readable text the same way the backend duplicate check does.
    private normalizeFreeText = (value: string) => {
        return value.trim().replace(/\s+/g, " ").toLowerCase();
    }

    // Removes whitespace so catalog-like names such as M31 and M 31 can be compared.
    private normalizeCompactText = (value: string) => {
        return value.replace(/\s+/g, "").toLowerCase();
    }

    // Builds exact comparison keys for a SAC identity field and its comma/semicolon aliases.
    private buildExactNameKeys = (value?: string) => {
        const keys = new Set<string>();
        this.addExactNameKeys(value, keys);
        return keys;
    }

    // Adds normalized exact-match keys without using common-name fields or substring matching.
    private addExactNameKeys = (value: string | undefined, keys: Set<string>) => {
        if (!value || !value.trim()) {
            return;
        }

        const addValue = (rawValue: string) => {
            const freeText = this.normalizeFreeText(rawValue);
            const compactText = this.normalizeCompactText(rawValue);
            if (freeText) {
                keys.add(freeText);
            }

            if (compactText) {
                keys.add(compactText);
            }
        };

        addValue(value);
        value.split(/[;,]/)
            .map(alias => alias.trim())
            .filter(alias => alias.length > 0)
            .forEach(addValue);
    }

    // Checks only SAC catalog identity fields, allowing custom objects that merely match common-name text.
    private isExactSacCatalogIdentityMatch = (name: string, dso: IDso) => {
        const requestedKeys = this.buildExactNameKeys(name);
        const dsoKeys = [
            dso.name,
            dso.otherNames,
        ].reduce((keys, value) => {
            this.addExactNameKeys(value, keys);
            return keys;
        }, new Set<string>());

        return Array.from(requestedKeys).some(key => dsoKeys.has(key));
    }

    // Resolves typed or selected Type values to SAC codes or the existing custom type's stored casing.
    private resolveObjectTypeOption = (value: string) => {
        const trimmedValue = (value || "").trim();
        if (!trimmedValue) {
            return "";
        }

        const sacTypeCode = resolveDsoTypeCode(trimmedValue);
        if (translateDsoType(sacTypeCode)) {
            return sacTypeCode;
        }

        const normalizedValue = trimmedValue.toLowerCase();
        const existingCustomType = [...this.state.userObjects, ...this.state.otherObjects]
            .map(object => this.resolveStoredObjectType(object.type || ""))
            .find(type => type.toLowerCase() === normalizedValue);

        return existingCustomType || trimmedValue;
    }

    // Converts stored object type strings to their canonical dropdown value without losing custom casing.
    private resolveStoredObjectType = (value: string) => {
        const trimmedValue = (value || "").trim();
        const sacTypeCode = resolveDsoTypeCode(trimmedValue);
        return translateDsoType(sacTypeCode) ? sacTypeCode : trimmedValue;
    }

    // Adds a Type option once, treating custom type labels as case-insensitive choices.
    private addTypeOption = (options: string[], existingOptions: Set<string>, value: string) => {
        const resolvedType = this.resolveStoredObjectType(value);
        const normalizedType = resolvedType.toLowerCase();
        if (resolvedType && !existingOptions.has(normalizedType)) {
            options.push(resolvedType);
            existingOptions.add(normalizedType);
        }
    }

    // Builds one option per object type, ordered by latest modification date and with null dates last.
    private getObjectTypeOptionsByModifiedDate = (objects: IObservedObject[]) => {
        const candidatesByType = new Map<string, ITypeOptionCandidate>();
        objects
            .map(object => ({
                modifiedDate: object.modifiedDate,
                value: this.resolveStoredObjectType(object.type || ""),
            }))
            .filter(candidate => candidate.value.length > 0)
            .forEach(candidate => {
                const normalizedType = candidate.value.toLowerCase();
                const existingCandidate = candidatesByType.get(normalizedType);
                if (!existingCandidate || this.compareTypeOptionsByModifiedDate(candidate, existingCandidate) < 0) {
                    candidatesByType.set(normalizedType, candidate);
                }
            });

        return Array.from(candidatesByType.values())
            .sort(this.compareTypeOptionsByModifiedDate)
            .map(candidate => candidate.value);
    }

    // Compares type options by modification time descending, falling back to display label order.
    private compareTypeOptionsByModifiedDate = (left: ITypeOptionCandidate, right: ITypeOptionCandidate) => {
        const leftModified = this.getModifiedDateSortValue(left.modifiedDate);
        const rightModified = this.getModifiedDateSortValue(right.modifiedDate);
        if (leftModified !== rightModified) {
            return rightModified - leftModified;
        }

        const leftLabel = translateDsoType(left.value) || left.value;
        const rightLabel = translateDsoType(right.value) || right.value;
        return leftLabel.localeCompare(rightLabel);
    }

    // Converts absent or invalid modified dates to the oldest possible sort value.
    private getModifiedDateSortValue = (modifiedDate?: string | null) => {
        if (!modifiedDate) {
            return Number.NEGATIVE_INFINITY;
        }

        const timestamp = Date.parse(modifiedDate);
        return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
    }

    // Builds Type dropdown options in source order: user object types, SAC types, shared object types.
    private getTypeOptions = () => {
        const options: string[] = [];
        const existingOptions = new Set<string>();

        this.getObjectTypeOptionsByModifiedDate(this.state.userObjects)
            .forEach(type => this.addTypeOption(options, existingOptions, type));
        SAC_OBJECT_TYPE_OPTIONS.forEach(type => this.addTypeOption(options, existingOptions, type));
        this.getObjectTypeOptionsByModifiedDate(this.state.otherObjects)
            .forEach(type => this.addTypeOption(options, existingOptions, type));
        this.addTypeOption(options, existingOptions, this.state.currentObject.type || "");

        return options;
    }

    // Keeps the free-solo Type input text synchronized with the stored type code when the form resets.
    private getTypeInputValue = () => {
        const currentType = this.state.currentObject.type || "";
        return translateDsoType(currentType) || currentType;
    }

    // Renders a Type dropdown option with the custom object-type preview icon before the label.
    private renderTypeOption = (props: React.HTMLAttributes<HTMLLIElement>, option: string) => {
        const { key, ...restProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
        return (
            <li key={key} {...restProps}>
                <span className={this.props.classes.typeOptionContent}>
                    <DsoTypeIcon type={option} className={this.props.classes.typeOptionIcon} />
                    <span>{translateDsoType(option) || option}</span>
                </span>
            </li>
        );
    }

    // Adds the same custom object-type icon to the editable Type field once a type is selected or typed.
    private renderTypeInput = (params: any) => {
        const currentType = this.state.currentObject.type || "";
        return (
            <TextField
                {...params}
                label="Type"
                margin="dense"
                size="small"
                InputProps={{
                    ...params.InputProps,
                    startAdornment: currentType ? (
                        <InputAdornment position="start" className={this.props.classes.typeInputAdornment}>
                            <DsoTypeIcon type={currentType} />
                        </InputAdornment>
                    ) : params.InputProps.startAdornment,
                }}
            />
        );
    }

    // Reads the last requested icon-preview state without blocking page render if browser storage is unavailable.
    private readTypeIconPreviewExpandedPreference = () => {
        try {
            return window.localStorage.getItem(TYPE_ICON_PREVIEW_EXPANDED_STORAGE_KEY) === "true";
        } catch {
            return false;
        }
    }

    // Stores the icon-preview state so the Objects view returns to the user's last chosen layout.
    private writeTypeIconPreviewExpandedPreference = (isExpanded: boolean) => {
        try {
            window.localStorage.setItem(TYPE_ICON_PREVIEW_EXPANDED_STORAGE_KEY, isExpanded ? "true" : "false");
        } catch {
            // Browsers can deny storage in restricted contexts; the in-memory state should still update.
        }
    }

    // Toggles the inline icon preview without changing any editable object fields.
    private handleToggleTypeIconPreview = () => {
        this.setState(prevState => {
            const isTypeIconPreviewExpanded = !prevState.isTypeIconPreviewExpanded;
            this.writeTypeIconPreviewExpandedPreference(isTypeIconPreviewExpanded);

            return { isTypeIconPreviewExpanded };
        });
    }

    // Renders every SAC object type directly below the object form heading.
    private renderTypeIconPreview = () => (
        <div className={this.props.classes.typePreviewList} role="group" aria-label="Object type icons">
            <div className={this.props.classes.typePreviewRow} data-dso-type-preview-row="generic-current">
                <Typography variant="body2" className={this.props.classes.typePreviewLabel}>
                    <DsoTypeIcon type="" size={28} />
                    <span>Undefined object fallback</span>
                </Typography>
            </div>
            <Typography variant="subtitle2" className={this.props.classes.typePreviewSectionTitle}>
                SAC object types
            </Typography>
            {getDsoTypeOptions().map(option => (
                <div
                    key={option.code}
                    className={this.props.classes.typePreviewRow}
                    data-dso-type-preview-row={option.code}
                >
                    <Typography variant="body2" className={this.props.classes.typePreviewLabel}>
                        <DsoTypeIcon type={option.code} size={32} />
                        <span>{option.longName}</span>
                    </Typography>
                </div>
            ))}
        </div>
    )

    // Returns the independent search value used by the requested object table.
    private getObjectTableSearchText = (tableKey: ObjectTableKey) => {
        return tableKey === "user"
            ? this.state.userObjectSearchText
            : this.state.otherObjectSearchText;
    }

    // Returns the active sort state used by the requested object table.
    private getObjectTableSortState = (tableKey: ObjectTableKey) => {
        return tableKey === "user"
            ? this.state.userObjectSort
            : this.state.otherObjectSort;
    }

    // Filters and sorts a table's objects entirely in the browser without mutating API response arrays.
    private getVisibleObjects = (objects: IObservedObject[], searchText: string, sortState: IObjectTableSortState) => {
        const filteredObjects = objects.filter(object => this.objectMatchesSearch(object, searchText));
        if (!sortState.column) {
            return filteredObjects;
        }

        return [...filteredObjects].sort((left, right) => this.compareObjectsByColumn(left, right, sortState.column!, sortState.direction));
    }

    // Checks the object fields a user can reasonably search from the management table and edit form.
    private objectMatchesSearch = (object: IObservedObject, searchText: string) => {
        const query = this.normalizeFreeText(searchText);
        if (!query) {
            return true;
        }

        const referenceDates = [
            ...(object.references || []).map(reference => reference.date),
            ...(object.referencedSessionDates || []),
        ];
        const searchableValues = [
            object.name,
            object.commonName,
            object.otherNames,
            object.allCommonNames,
            object.notes,
            this.getObjectTypeDisplayValue(object),
            object.type,
            object.const,
            object.ra,
            object.dec,
            object.mag,
            this.formatModifiedDate(object.modifiedDate),
            object.modifiedDate,
            `${object.numReferences || 0}`,
            ...referenceDates,
        ];

        return searchableValues.some(value => this.normalizeFreeText(value || "").includes(query));
    }

    // Compares two objects for one sortable table column, keeping empty values at the bottom in both directions.
    private compareObjectsByColumn = (
        left: IObservedObject,
        right: IObservedObject,
        column: ObjectTableSortColumn,
        direction: ObjectTableSortDirection,
    ) => {
        const primaryComparison = column === "mag" || column === "references" || column === "modified"
            ? this.compareObjectNumberValues(this.getObjectSortNumberValue(left, column), this.getObjectSortNumberValue(right, column), direction)
            : this.compareObjectTextValues(this.getObjectSortTextValue(left, column), this.getObjectSortTextValue(right, column), direction);

        if (primaryComparison !== 0) {
            return primaryComparison;
        }

        return this.compareObjectTextValues(left.name || "", right.name || "", "asc");
    }

    // Extracts the display text used for text-sortable object table columns.
    private getObjectSortTextValue = (object: IObservedObject, column: ObjectTableSortColumn) => {
        switch (column) {
            case "name":
                return object.name || "";
            case "type":
                return this.getObjectTypeDisplayValue(object);
            case "constellation":
                return object.const || "";
            default:
                return "";
        }
    }

    // Extracts the numeric value used for Mag and References sorting.
    private getObjectSortNumberValue = (object: IObservedObject, column: ObjectTableSortColumn) => {
        if (column === "references") {
            return object.numReferences || 0;
        }

        if (column === "modified") {
            return this.getObjectModifiedDateSortValue(object.modifiedDate);
        }

        const magnitude = Number.parseFloat(object.mag || "");
        return Number.isNaN(magnitude) ? undefined : magnitude;
    }

    // Converts an object's modified date to a timestamp for table sorting, leaving missing dates last.
    private getObjectModifiedDateSortValue = (modifiedDate?: string | null) => {
        if (!modifiedDate) {
            return undefined;
        }

        const timestamp = Date.parse(modifiedDate);
        return Number.isNaN(timestamp) ? undefined : timestamp;
    }

    // Compares optional table text values with blanks last and locale-aware ordering for labels.
    private compareObjectTextValues = (leftValue: string, rightValue: string, direction: ObjectTableSortDirection) => {
        const left = this.normalizeFreeText(leftValue || "");
        const right = this.normalizeFreeText(rightValue || "");
        if (!left && !right) {
            return 0;
        }

        if (!left) {
            return 1;
        }

        if (!right) {
            return -1;
        }

        const comparison = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
        return direction === "asc" ? comparison : -comparison;
    }

    // Compares optional table number values with blanks last in both ascending and descending order.
    private compareObjectNumberValues = (
        leftValue: number | undefined,
        rightValue: number | undefined,
        direction: ObjectTableSortDirection,
    ) => {
        if (leftValue === undefined && rightValue === undefined) {
            return 0;
        }

        if (leftValue === undefined) {
            return 1;
        }

        if (rightValue === undefined) {
            return -1;
        }

        const comparison = leftValue - rightValue;
        return direction === "asc" ? comparison : -comparison;
    }

    // Centralizes Type table display so sorting and searching match what the user sees.
    private getObjectTypeDisplayValue = (object: IObservedObject) => {
        return getDsoTypeAbbreviation(object.type || "") || object.type || "";
    }

    // Formats modified dates compactly for the object tables while preserving empty cells for unknown dates.
    private formatModifiedDate = (modifiedDate?: string | null) => {
        if (!modifiedDate) {
            return "";
        }

        const date = new Date(modifiedDate);
        if (Number.isNaN(date.getTime())) {
            return modifiedDate;
        }

        return date.toISOString().slice(0, 10);
    }

    // Renders one sortable header cell for the columns that support table ordering.
    private renderSortableHeaderCell = (
        label: string,
        column: ObjectTableSortColumn,
        tableKey: ObjectTableKey,
        sortState: IObjectTableSortState,
    ) => (
        <TableCell className={this.props.classes.tableCell}>
            <TableSortLabel
                active={sortState.column === column}
                direction={sortState.column === column ? sortState.direction : "asc"}
                onClick={this.handleObjectSortChange(tableKey, column)}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    )

    // Renders the table title row and right-aligned frontend search field.
    private renderObjectTableHeader = (title: string, tableKey: ObjectTableKey, searchText: string) => (
        <div className={this.props.classes.objectTableHeader}>
            <Typography variant="h6">{title}</Typography>
            <TextField
                className={this.props.classes.objectTableSearch}
                margin="dense"
                onChange={this.handleObjectSearchChange(tableKey)}
                placeholder="Search"
                size="small"
                type="search"
                value={searchText}
                inputProps={{
                    "aria-label": `Search ${title.toLowerCase()}`,
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                }}
            />
        </div>
    )

    // Extracts API error messages from both string BadRequest bodies and ObsToolException JSON bodies.
    private getApiErrorMessage = (error: any, fallbackMessage: string) => {
        const data = error?.response?.data;
        if (typeof data === "string") {
            return data;
        }

        if (data?.message) {
            return data.message;
        }

        if (data?.Message) {
            return data.Message;
        }

        if (data?.title) {
            return data.title;
        }

        return fallbackMessage;
    }

    // Saves a new object or updates the currently selected user object.
    private handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!this.isCurrentObjectValid()) {
            this.setState({ isError: true, errorMessage: "Name is required." });
            return;
        }

        const duplicateObject = this.getDuplicateCurrentObjectConflict();
        if (duplicateObject) {
            this.setState({
                isError: true,
                errorMessage: this.formatDuplicateObjectMessage(duplicateObject),
            });
            return;
        }

        if (this.state.similarSacObjects.length > 0 && !this.state.currentObject.id) {
            this.setState({
                isError: true,
                errorMessage: `A SAC object named '${this.state.similarSacObjects[0].name}' already exists.`,
            });
            return;
        }

        const currentId = this.state.currentObject.id;
        const payload = this.getSavePayload();
        const saveObject = () => {
            this.setState({ isSaving: true, isError: false, errorMessage: undefined });
            const request = currentId
                ? this.state.currentObject.objectKind === "Other"
                    ? Api.updateOtherObject(currentId, payload)
                    : Api.updateUserObject(currentId, payload)
                : this.state.saveAsUserObject
                    ? Api.addUserObject(payload)
                    : Api.addOtherObject(payload);

            request.then(() => {
                this.setState({ isSaving: false });
                this.loadObjectsFromApi(currentId ? "" : payload.type);
            }).catch(error => {
                const message = this.getApiErrorMessage(error, "Failed to save object.");
                this.setState({ isSaving: false, isError: true, errorMessage: message });
            });
        };

        if (currentId) {
            saveObject();
            return;
        }

        this.checkSacConflictBeforeCreate(payload.name).then(exactMatches => {
            if (exactMatches.length > 0) {
                this.setState({
                    isError: true,
                    errorMessage: `A SAC object named '${exactMatches[0].name}' already exists.`,
                });
                return;
            }

            saveObject();
        }).catch(error => {
            this.setState({
                isError: true,
                errorMessage: error.message || "Failed to verify the object name before saving.",
            });
        });
    }

    // Selects an existing editable object while preserving Name as read-only.
    private handleEditObject = (objectToEdit: IObservedObject) => {
        this.setState({
            currentObject: { ...objectToEdit },
            saveAsUserObject: objectToEdit.objectKind !== "Other",
            similarSacObjects: [],
            isError: false,
            errorMessage: undefined,
        });
    }

    // Clears the edit form back to add mode.
    private handleAddNew = () => {
        this.setState({
            currentObject: this.getEmptyObject(),
            similarSacObjects: [],
            isError: false,
            errorMessage: undefined,
        });
    }

    // Opens the confirmation dialog for deletable user and shared objects.
    private handleRequestDelete = (objectToDelete: IObservedObject) => {
        this.setState({ deleteCandidate: objectToDelete });
    }

    // Closes the delete dialog without changing data.
    private handleCancelDelete = () => {
        this.setState({ deleteCandidate: undefined });
    }

    // Closes the shared delete dialog and deletes only after the single confirmation click.
    private handleDeleteDialogClosed = (confirm: boolean) => {
        if (!confirm) {
            this.handleCancelDelete();
            return;
        }

        this.handleConfirmDelete();
    }

    // Deletes the selected object through the matching API endpoint, relying on the backend to reject references too.
    private handleConfirmDelete = () => {
        const deleteCandidate = this.state.deleteCandidate;
        if (!deleteCandidate?.id) {
            this.handleCancelDelete();
            return;
        }

        this.setState({ isSaving: true, deleteCandidate: undefined, isError: false, errorMessage: undefined });
        const deleteRequest = deleteCandidate.objectKind === "Other"
            ? Api.deleteOtherObject(deleteCandidate.id)
            : Api.deleteUserObject(deleteCandidate.id);

        deleteRequest.then(() => {
            this.setState({ isSaving: false });
            this.loadObjectsFromApi();
        }).catch(error => {
            const message = this.getApiErrorMessage(error, "Failed to delete object.");
            this.setState({ isSaving: false, isError: true, errorMessage: message });
        });
    }

    // Renders reference count and session links in the user/shared object tables.
    private renderReferenceSummary = (object: IObservedObject) => {
        const count = object.numReferences || 0;
        const references = object.references || [];
        const fallbackDates = object.referencedSessionDates || [];
        return (
            <>
                <Typography variant="body2">{count}</Typography>
                {references.length > 0 ? (
                    <div className={this.props.classes.referenceLinks}>
                        {references.map(reference => (
                            <Link
                                key={`${object.objectKey || object.id}-${reference.obsSessionId}`}
                                to={`/session/${reference.obsSessionId}`}
                            >
                                {reference.date}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Typography variant="caption" color="textSecondary">
                        {fallbackDates.length > 0 ? fallbackDates.join(", ") : "None"}
                    </Typography>
                )}
            </>
        );
    }

    // Renders one object table with search, sortable columns, and per-row edit/delete controls from API flags.
    private renderObjectTable = (title: string, objects: IObservedObject[], tableKey: ObjectTableKey) => {
        const searchText = this.getObjectTableSearchText(tableKey);
        const sortState = this.getObjectTableSortState(tableKey);
        const visibleObjects = this.getVisibleObjects(objects, searchText, sortState);
        const hasActions = objects.some(object => object.canEdit || object.objectKind === "User");
        const columnCount = hasActions ? 9 : 8;
        const rows = visibleObjects.map(object => {
            const canEditObject = !!object.canEdit;
            const showDeleteObject = object.objectKind === "User" || (object.objectKind === "Other" && canEditObject);
            const deleteDisabled = !object.canDelete;
            return (
                <TableRow key={object.objectKey || `${title}-${object.id}`}>
                    <TableCell className={this.props.classes.nameCell}>
                        <Typography variant="body2" className={this.props.classes.objectName}>{object.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{object.commonName || object.otherNames || ""}</Typography>
                    </TableCell>
                    <TableCell className={this.props.classes.tableCell}>{this.getObjectTypeDisplayValue(object)}</TableCell>
                    <TableCell className={this.props.classes.tableCell}>{object.const || ""}</TableCell>
                    <TableCell className={this.props.classes.tableCell}>{object.ra || ""}</TableCell>
                    <TableCell className={this.props.classes.tableCell}>{object.dec || ""}</TableCell>
                    <TableCell className={this.props.classes.tableCell}>{object.mag || ""}</TableCell>
                    <TableCell className={this.props.classes.metadataCell}>{this.renderReferenceSummary(object)}</TableCell>
                    <TableCell className={this.props.classes.tableCell}>{this.formatModifiedDate(object.modifiedDate)}</TableCell>
                    {hasActions && (
                        <TableCell align="right" className={this.props.classes.actionCell}>
                            {canEditObject && (
                                <Tooltip title="Edit">
                                    <IconButton
                                        aria-label={`Edit ${object.name}`}
                                        onClick={() => this.handleEditObject(object)}
                                        size="small"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {showDeleteObject && (
                                <Tooltip title={deleteDisabled ? "Only unreferenced objects can be deleted" : "Delete"}>
                                    <span>
                                        <IconButton
                                            aria-label={`Delete ${object.name}`}
                                            onClick={() => this.handleRequestDelete(object)}
                                            size="small"
                                            disabled={deleteDisabled}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </TableCell>
                    )}
                </TableRow>
            );
        });

        return (
            <Paper className={this.props.classes.panel} elevation={1}>
                {this.renderObjectTableHeader(title, tableKey, searchText)}
                {objects.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">None</Typography>
                ) : (
                    <div className={this.props.classes.tableWrapper}>
                        <Table size="small" padding="none">
                            <TableHead>
                                <TableRow>
                                    {this.renderSortableHeaderCell("Name", "name", tableKey, sortState)}
                                    {this.renderSortableHeaderCell("Type", "type", tableKey, sortState)}
                                    {this.renderSortableHeaderCell("Constellation", "constellation", tableKey, sortState)}
                                    <TableCell className={this.props.classes.tableCell}>RA</TableCell>
                                    <TableCell className={this.props.classes.tableCell}>DEC</TableCell>
                                    {this.renderSortableHeaderCell("Mag", "mag", tableKey, sortState)}
                                    {this.renderSortableHeaderCell("References", "references", tableKey, sortState)}
                                    {this.renderSortableHeaderCell("Modified", "modified", tableKey, sortState)}
                                    {hasActions && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length > 0 ? rows : (
                                    <TableRow>
                                        <TableCell colSpan={columnCount} className={this.props.classes.tableCell}>
                                            <Typography variant="body2" color="textSecondary">No matching objects</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Paper>
        );
    }

    public render() {
        const { classes } = this.props;
        const isEditing = !!this.state.currentObject.id;
        const duplicateObject = this.getDuplicateCurrentObjectConflict();
        const exactSacObjectNames = this.state.similarSacObjects.map(dso => dso.name);
        const canCreateOtherObject = this.state.canCreateOtherObjects && !isEditing;
        const currentConstellationValue = [UNSPECIFIED_CONSTELLATION_OPTION, ...this.state.constellations]
            .find(constellation => constellation.abbreviation.toUpperCase() === (this.state.currentObject.const || "").toUpperCase()) || UNSPECIFIED_CONSTELLATION_OPTION;
        const canSave = this.props.store.isLoggedIn
            && this.isCurrentObjectValid()
            && !duplicateObject
            && exactSacObjectNames.length === 0
            && !this.state.isCheckingSimilar
            && !this.state.isSaving;
        const canPreviewTypeIcons = this.props.store.loggedInUserId === 1;
        const typePreviewToggleLabel = this.state.isTypeIconPreviewExpanded
            ? "Hide object type icons"
            : "Show object type icons";
        const duplicateNameWarning = duplicateObject && !isEditing ? (
            <Alert severity="error" style={{ marginTop: 12 }}>
                {this.formatDuplicateObjectMessage(duplicateObject)}
            </Alert>
        ) : null;
        const similarSacWarning = exactSacObjectNames.length > 0 && !isEditing ? (
            <Alert severity="error" style={{ marginTop: 12 }}>
                SAC object already exists: {exactSacObjectNames.join(", ")}
            </Alert>
        ) : null;
        const deleteCandidate = this.state.deleteCandidate;
        const deleteObjectKindLabel = deleteCandidate?.objectKind === "Other" ? "other object" : "user object";
        const deleteDialog = (
            <DeleteDialog
                isOpen={Boolean(deleteCandidate)}
                title={deleteCandidate
                    ? `Delete ${deleteObjectKindLabel} ${deleteCandidate.name}?`
                    : "Delete object?"}
                text={deleteCandidate
                    ? `Are you sure you want to delete this ${deleteObjectKindLabel}? The object is not referenced by any observation and can be safely removed.`
                    : "Are you sure you want to delete this object? The object is not referenced by any observation and can be safely removed."}
                onHandleClose={this.handleDeleteDialogClosed}
            />
        );

        return (
            <div className={classes.root}>
                <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                    <FontAwesomeIcon icon="star" className="faSpaceAfter" size="lg" /> Managing Objects
                </Typography>
                <Grid container spacing={3} justifyContent="center">
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper className={classes.panel} elevation={1}>
                            <div className={classes.formHeading}>
                                <Typography variant="h6" gutterBottom={true}>
                                    {isEditing
                                        ? this.state.currentObject.objectKind === "Other"
                                            ? "Edit other object"
                                            : "Edit user defined object"
                                        : this.state.saveAsUserObject
                                            ? "Add user defined object"
                                            : "Add other object"}
                                </Typography>
                                {canPreviewTypeIcons && (
                                    <IconButton
                                        aria-label={typePreviewToggleLabel}
                                        className={classes.typePreviewToggle}
                                        onClick={this.handleToggleTypeIconPreview}
                                        size="small"
                                    >
                                        <ExpandMoreIcon
                                            className={`${classes.typePreviewToggleIcon} ${this.state.isTypeIconPreviewExpanded ? classes.typePreviewToggleIconOpen : ""}`}
                                        />
                                    </IconButton>
                                )}
                            </div>
                            {canPreviewTypeIcons && this.state.isTypeIconPreviewExpanded && this.renderTypeIconPreview()}
                            <form onSubmit={this.handleSubmit} noValidate={true} autoComplete="off">
                                <div className={classes.formGrid}>
                                    <Tooltip title={isEditing ? "Name is the stable report-text identifier and cannot be changed after creation." : ""}>
                                        <div className={classes.thirdRowField}>
                                            <TextField
                                                label="Name"
                                                value={this.state.currentObject.name || ""}
                                                onChange={this.handleFormChange("name")}
                                                margin="dense"
                                                size="small"
                                                required={true}
                                                disabled={isEditing}
                                                inputProps={{
                                                    className: `${classes.nameInputText} ${isEditing ? classes.disabledNameInputText : ""}`,
                                                }}
                                                fullWidth={true}
                                            />
                                        </div>
                                    </Tooltip>
                                    <TextField
                                        label="Common name"
                                        value={this.state.currentObject.commonName || ""}
                                        onChange={this.handleFormChange("commonName")}
                                        margin="dense"
                                        size="small"
                                        className={classes.thirdRowField}
                                    />
                                    <Autocomplete
                                        size="small"
                                        freeSolo={true}
                                        options={this.getTypeOptions()}
                                        value={this.state.currentObject.type || null}
                                        inputValue={this.getTypeInputValue()}
                                        getOptionLabel={(option) => translateDsoType(option) || option}
                                        onChange={this.handleTypeChange}
                                        onInputChange={this.handleTypeInputChange}
                                        renderOption={this.renderTypeOption}
                                        renderInput={this.renderTypeInput}
                                        className={classes.thirdRowField}
                                    />
                                    <TextField label="All common names" value={this.state.currentObject.allCommonNames || ""} onChange={this.handleFormChange("allCommonNames")} margin="dense" size="small" className={classes.halfRowField} />
                                    <TextField label="Other names" value={this.state.currentObject.otherNames || ""} onChange={this.handleFormChange("otherNames")} margin="dense" size="small" className={classes.halfRowField} />
                                    <Autocomplete
                                        size="small"
                                        options={[UNSPECIFIED_CONSTELLATION_OPTION, ...this.state.constellations]}
                                        value={currentConstellationValue}
                                        getOptionLabel={(option) => option.abbreviation ? option.name : "Unspecified"}
                                        isOptionEqualToValue={(option, value) => option.abbreviation === value.abbreviation}
                                        onChange={this.handleConstellationChange}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Constellation" margin="dense" size="small" />
                                        )}
                                        className={classes.quarterRowField}
                                    />
                                    <TextField label="RA" value={this.state.currentObject.ra || ""} onChange={this.handleFormChange("ra")} margin="dense" size="small" className={classes.quarterRowField} />
                                    <TextField label="DEC" value={this.state.currentObject.dec || ""} onChange={this.handleFormChange("dec")} margin="dense" size="small" className={classes.quarterRowField} />
                                    <TextField label="Mag" value={this.state.currentObject.mag || ""} onChange={this.handleFormChange("mag")} margin="dense" size="small" className={classes.quarterRowField} />
                                    <TextField label="Notes" value={this.state.currentObject.notes || ""} onChange={this.handleFormChange("notes")} margin="dense" size="small" multiline={true} minRows={2} className={classes.fullWidthField} />
                                </div>
                                {duplicateNameWarning}
                                {similarSacWarning}
                                <div className={classes.actionRow}>
                                    <Button variant="contained" color="primary" type="submit" disabled={!canSave} startIcon={<SaveIcon />}>
                                        {isEditing ? "Update" : "Save"}
                                    </Button>
                                    {this.isCurrentObjectValid() && (
                                        <Button color="primary" onClick={this.handleAddNew} startIcon={isEditing ? <CancelIcon /> : <ClearIcon />}>
                                            {isEditing ? "Cancel" : "Clear"}
                                        </Button>
                                    )}
                                    {canCreateOtherObject && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={this.state.saveAsUserObject}
                                                    onChange={this.handleSaveAsUserObjectChange}
                                                    color="primary"
                                                />
                                            }
                                            label="User defined object"
                                            className={classes.fullWidthField}
                                        />
                                    )}
                                    {(this.state.isSaving || this.state.isCheckingSimilar) && <CircularProgress size={24} />}
                                </div>
                                {this.state.isError && (
                                    <Alert severity="error" style={{ marginTop: 12 }}>{this.state.errorMessage || "Something went wrong."}</Alert>
                                )}
                            </form>
                        </Paper>
                        {this.state.isLoading ? (
                            <Paper className={classes.panel} elevation={1}>
                                <CircularProgress />
                            </Paper>
                        ) : (
                            <>
                                {this.renderObjectTable("User defined objects", this.state.userObjects, "user")}
                                {this.renderObjectTable("Other objects", this.state.otherObjects, "other")}
                            </>
                        )}
                    </Grid>
                </Grid>
                {deleteDialog}
            </div>
        );
    }
}

const mapStateToProps = (state: IAppState) => ({
    store: state.data,
});

export const StyledObjectsView = withStyles(styles)(ObjectsView);

export default connect(mapStateToProps)(StyledObjectsView);
