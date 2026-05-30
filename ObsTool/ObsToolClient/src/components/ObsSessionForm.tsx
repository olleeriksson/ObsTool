import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextField";
import DsoShort from "./DsoShort";
import { IObsSession, ILocation, IInstrument, IObservation, IDsoObservation, IEyepiece } from "../types/Types";
import classNames from "classnames";
import Grid from "@mui/material/Grid2";
import SelectComponent, { IKeyValuePair } from "./SelectComponent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import { getObservedObjectTargetKey } from "./ObservationTarget";

const hiddenObservationIdentifierRegexp = /#\d+(?:-(?:\d+|![A-Z0-9]+!))*/gi;
const unmatchedObservationIdentifierRegexp = /!([A-Za-z0-9]+)!/g;

const styles = (theme: Theme) => createStyles({
  form: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "95%",
  },
  textField: {},
  textFieldMultiLine: {
    height: 100,
  },
  textFieldReportText: {
    overflow: "hidden"
  },
  reportTextField: {
    boxSizing: "border-box",
    width: `calc(100% - ${theme.spacing(2)})`,
  },
  saveButton: {
    marginRight: `calc(5% - ${theme.spacing(1)})`,
  },
  ratingSaveRow: {
    boxSizing: "border-box",
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    maxWidth: `calc(100% - ${theme.spacing(2)})`,
    width: `calc(100% - ${theme.spacing(2)})`,
    alignItems: "flex-end",
  },
  ratingControls: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  },
  topActionColumn: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  bottomSaveButton: {
    marginRight: 0,
  },
  dateField: {
    width: 180,
    marginRight: theme.spacing(2),
  },
  selectLocation: {
    width: 300,
    marginRight: theme.spacing(2),
  },
  selectInstrument: {
    width: 300,
    marginRight: theme.spacing(2),
  },
  select: {
    width: 100,
    marginRight: theme.spacing(2),
  },
  ratingSelect: {
    width: 100,
    marginLeft: 0,
    marginRight: theme.spacing(2),
  },
  ratingLimitingMagnitude: {
    width: 180,
    marginLeft: 0,
    marginRight: theme.spacing(2),
  },
  singleDsoContainer: {
    marginBottom: "0.8em",
    marginTop: "0.8em"
  },
  multipleDsoContainer: {
    marginBottom: "0.8em",
    marginTop: "0.8em"
  },
  unmatchedObservationContainer: {
    borderLeft: `3px solid ${theme.palette.warning.dark}`,
    marginBottom: "0.8em",
    marginTop: "0.8em",
    paddingLeft: theme.spacing(0.6),
  },
  unmatchedObservationText: {
    color: theme.palette.text.secondary,
    fontWeight: 700,
    fontSize: "0.825rem",
    lineHeight: 1.25,
    overflowWrap: "anywhere",
  },
  formError: {
    backgroundColor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.16 : 0.08),
    borderLeft: `3px solid ${theme.palette.error.main}`,
    color: theme.palette.error.dark,
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(1),
    width: "95%",
  },
  formErrorText: {
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.45,
  },
  sessionBodyRow: {
    columnGap: theme.spacing(1.5),
    flexWrap: "nowrap",
    width: "100%",
  },
  sessionBodyWrapper: {
    maxWidth: "100%",
    minWidth: 0,
    width: "100%",
  },
  formFieldsColumn: {
    flex: "1 1 auto",
    maxWidth: "none",
    minWidth: 0,
    width: "auto",
    "& > .MuiGrid2-root": {
      maxWidth: "100%",
      minWidth: 0,
      width: "100%",
    },
  },
  objectListColumn: {
    flex: "0 0 90px",
    maxWidth: 90,
    minWidth: 90,
    paddingTop: theme.spacing(5),
  },
  objectListHeading: {
    fontWeight: 900,
    fontSize: "0.95rem",
    fontStyle: "underline",
    marginBottom: theme.spacing(1.5),
  },
  helpReferenceRow: {
    boxSizing: "border-box",
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    maxWidth: `calc(100% - ${theme.spacing(2)})`,
    width: `calc(100% - ${theme.spacing(2)})`,
    alignItems: "flex-start",
    columnGap: theme.spacing(1.5),
    flexWrap: "wrap",
    rowGap: theme.spacing(1),
  },
  helpTextColumn: {
    flex: "1 1 200px",
    maxWidth: 390,
    minWidth: 200,
  },
  helpText: {
    lineHeight: 1.4,
    whiteSpace: "normal",
  },
  bottomActionColumn: {
    display: "flex",
    justifyContent: "flex-end",
    flex: "0 0 68px",
  },
  equipmentActionGrid: {
    alignItems: "flex-start",
    columnGap: theme.spacing(2.5),
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "end",
    marginLeft: "auto",
    rowGap: theme.spacing(1),
  },
  keyReferenceColumn: {
    lineHeight: 1.35,
  },
  eyepieceReferenceColumn: {
    flex: "0 0 auto",
    maxWidth: "none",
  },
  instrumentReferenceColumn: {
    flex: "0 0 auto",
    maxWidth: "none",
  },
  keyChipGrid: {
    display: "grid",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "0.78rem",
    gap: theme.spacing(.5),
  },
  eyepieceKeyGrid: {
    columnGap: theme.spacing(1),
    gridTemplateColumns: "repeat(2, var(--key-chip-width))",
  },
  instrumentKeyGrid: {
    gridTemplateColumns: "var(--key-chip-width)",
  },
  referenceSection: {
    marginBottom: theme.spacing(1),
  },
  referenceHeading: {
    fontWeight: 700,
  },
  keyChip: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
    cursor: "pointer",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "0.78rem",
    lineHeight: 1.2,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(0.5),
    padding: "2px 5px",
    textAlign: "left",
    whiteSpace: "nowrap",
    width: "var(--key-chip-width)",
  },
  keyChipFeedbackSlot: {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 1rem",
    height: "1rem",
    justifyContent: "center",
    width: "1rem",
  },
  keyChipFeedbackIcon: {
    color: theme.palette.success.main,
    fontSize: "0.9rem",
  }
});

export interface IObsSessionFormProps extends WithStyles<typeof styles> {
  obsSession: IObsSession;
  locations?: ILocation[];
  instruments?: IInstrument[];
  eyepieces?: IEyepiece[];
  onSaveObsSession: (obsSession: IObsSession) => void;
  onSelectObservedObject: (targetKey: string) => void;
  isLoading: boolean;
  allowEditing: boolean;
  errorMessage?: string;
}

export interface IObsSessionFormState {
  errorOnControl: { [key: string]: string | undefined };
  obsSession: IObsSession;
  recentlyCopiedKey?: string;
}

class ObsSessionForm extends React.Component<IObsSessionFormProps, IObsSessionFormState> {
  constructor(props: IObsSessionFormProps) {
    super(props);

    this.state = {
      errorOnControl: {},
      obsSession: {
        title: "",
        date: new Date().toISOString().slice(0, 10),
        locationId: undefined,
        instrumentId: undefined,
        summary: "",
        conditions: "",
        seeing: undefined,
        transparency: undefined,
        limitingMagnitude: undefined,
        reportText: "",
        dsoObjects: [],
      },
      recentlyCopiedKey: undefined,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public componentDidUpdate(prevProps: IObsSessionFormProps) {
    if (this.props.obsSession && this.props.obsSession !== prevProps.obsSession) {
      this.setState({ obsSession: this.props.obsSession });
    }
  }

  public componentDidMount() {
    if (this.props.obsSession) {
      this.setState({ obsSession: this.props.obsSession });
    }
  }

  // Clears pending feedback timer so React never updates after this form has unmounted.
  public componentWillUnmount() {
    if (this.keyFeedbackTimeoutId) {
      window.clearTimeout(this.keyFeedbackTimeoutId);
    }
  }

  private keyFeedbackTimeoutId?: number;

  private handleSubmit(e: any) {
    e.preventDefault();
    this.props.onSaveObsSession(this.state.obsSession);
  }

  private handleChange = (name: string) => (event: any) => {
    const newValue = event.target.value;
    this.setState((prevState) => ({
      obsSession: {
        ...prevState.obsSession,
        [name]: newValue
      }
    }));
  }

  private sortObsByDisplayOrder = (observationA: IObservation, observationB: IObservation) => {
    return (observationA.displayOrder || 0) - (observationB.displayOrder || 0);
  }

  private sortDsoObsByDisplayOrder = (dsoObsA: IDsoObservation, dsoObsB: IDsoObservation) => {
    return (dsoObsA.displayOrder || 0) - (dsoObsB.displayOrder || 0);
  }

  private sortByKey = <T extends { key?: string | null }>(itemA: T, itemB: T) => {
    return (itemA.key || "").localeCompare(itemB.key || "");
  }

  // Treats null or whitespace keys as absent so session-only instruments are not parser copy targets.
  private hasReferenceKey = <T extends { key?: string | null }>(item: T): item is T & { key: string } => {
    return !!item.key?.trim();
  }

  // Keeps keyed instruments first in the selector, while keyless session labels sort by name.
  private sortInstrumentOptions = (instrumentA: IInstrument, instrumentB: IInstrument) => {
    const keyA = instrumentA.key?.trim();
    const keyB = instrumentB.key?.trim();
    if (keyA && keyB) {
      return keyA.localeCompare(keyB);
    }
    if (keyA) {
      return -1;
    }
    if (keyB) {
      return 1;
    }
    return instrumentA.name.localeCompare(instrumentB.name);
  }

  // Shows keyless instruments by name only, because they do not have a report-parser key.
  private getInstrumentOptionLabel = (instrument: IInstrument) => {
    const key = instrument.key?.trim();
    return key ? `${key} - ${instrument.name}` : instrument.name;
  }

  // Builds a stable identity for the temporary copy feedback so duplicate keys in separate sections do not collide.
  private getReferenceFeedbackKey = (title: string, key: string) => {
    return `${title}:${key}`;
  }

  // Sizes all key chips from the longest visible key, with reserved room for the temporary checkmark.
  private getReferenceKeyChipWidth = (items: Array<{ key?: string | null }>) => {
    const keyedItems = items.filter(this.hasReferenceKey);
    const maxKeyLength = keyedItems.reduce((currentMax, item) => Math.max(currentMax, item.key.trim().length), 1);
    return `calc(${maxKeyLength}ch + 2.25rem)`;
  }

  // Copies the clicked key and shows a short-lived checkmark without changing the saved session data.
  private copyKeyToClipboard = (feedbackKey: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key);
    }

    if (this.keyFeedbackTimeoutId) {
      window.clearTimeout(this.keyFeedbackTimeoutId);
    }

    this.setState({ recentlyCopiedKey: feedbackKey });
    this.keyFeedbackTimeoutId = window.setTimeout(() => {
      this.setState((prevState) => (
        prevState.recentlyCopiedKey === feedbackKey
          ? { recentlyCopiedKey: undefined }
          : null
      ));
    }, 1000);
  }

  // Pulls normalized unmatched object names out of parser identifiers such as 5-0-!NGC12345!.
  private getUnmatchedIdentifierLabels = (identifier?: string) => {
    if (!identifier) {
      return [];
    }

    unmatchedObservationIdentifierRegexp.lastIndex = 0;
    const labels: string[] = [];
    let match = unmatchedObservationIdentifierRegexp.exec(identifier);
    while (match) {
      labels.push(match[1]);
      match = unmatchedObservationIdentifierRegexp.exec(identifier);
    }
    return labels;
  }

  // Builds a compact fallback label for observation sections without parser-provided unmatched object names.
  private getUnmatchedObservationLabel = (observation: IObservation) => {
    const normalizedText = (observation.text || "")
      .replace(hiddenObservationIdentifierRegexp, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedText) {
      return "Untitled section";
    }

    const firstSentence = normalizedText.split(/[.!?]/)[0].trim() || normalizedText;
    return firstSentence.length > 56 ? `${firstSentence.slice(0, 53)}...` : firstSentence;
  }

  // Prefer explicit unmatched identifier tokens, while still supporting older unmatched observations.
  private getUnmatchedObservationLabels = (observation: IObservation) => {
    const identifierLabels = this.getUnmatchedIdentifierLabels(observation.identifier);
    return identifierLabels.length > 0 ? identifierLabels : [this.getUnmatchedObservationLabel(observation)];
  }

  // Renders an unmatched observation as a warning-style row in the compact object list.
  private renderUnmatchedObservation = (observation: IObservation, observationIndex: number, label?: string, unmatchedIndex = 0) => {
    const { classes } = this.props;
    const displayLabel = label || this.getUnmatchedObservationLabel(observation);
    const tooltipTitle = `${displayLabel} did not match any known object.`;
    const key = label
      ? `${observation.id ?? `unmatched-observation-${observationIndex}`}-${label}-${unmatchedIndex}`
      : observation.id ?? `unmatched-observation-${observationIndex}`;

    return (
      <Tooltip key={key} arrow={true} placement="left" title={tooltipTitle}>
        <div className={classes.unmatchedObservationContainer}>
          <Typography variant="caption" component={"div" as any} className={classes.unmatchedObservationText}>
            {displayLabel}
          </Typography>
        </div>
      </Tooltip>
    );
  }

  private renderKeyReferenceSection = <T extends { id?: number; key?: string | null }>(
    title: string,
    items: T[],
    gridClassName: string,
    keyChipWidth: string
  ) => {
    // Keys are compact editing aids that can be copied without changing the saved session data.
    const sortedItems = [...items].filter(this.hasReferenceKey).sort(this.sortByKey);
    const content = sortedItems.length === 0 ? (
      <Typography variant="caption" color="textSecondary">None</Typography>
    ) : (
      <div
        className={classNames(this.props.classes.keyChipGrid, gridClassName)}
        style={{ "--key-chip-width": keyChipWidth } as React.CSSProperties}
      >
        {sortedItems.map(item => {
          const key = item.key.trim();
          const feedbackKey = this.getReferenceFeedbackKey(title, key);
          const showFeedback = this.state.recentlyCopiedKey === feedbackKey;
          return (
            <Tooltip key={item.id || key} describeChild={true} enterDelay={500} title="Click to copy to clipboard">
              <button
                type="button"
                className={this.props.classes.keyChip}
                onClick={() => this.copyKeyToClipboard(feedbackKey, key)}
              >
                <span>{key}</span>
                <span className={this.props.classes.keyChipFeedbackSlot}>
                  {showFeedback && (
                    <CheckIcon
                      className={this.props.classes.keyChipFeedbackIcon}
                      data-testid={`key-chip-feedback-${feedbackKey}`}
                    />
                  )}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    );

    return (
      <div className={this.props.classes.referenceSection}>
        <Typography variant="caption" color="textSecondary" component={"div" as any} className={this.props.classes.referenceHeading}>
          {title}
        </Typography>
        {content}
      </div>
    );
  }

  public render() {
    const { classes } = this.props;

    let dsoObjects: any = [];
    if (this.state.obsSession.observations) {
      dsoObjects = [...this.state.obsSession.observations]
        .sort(this.sortObsByDisplayOrder)
        .map((o, index) => {
          const unmatchedLabels = this.getUnmatchedIdentifierLabels(o.identifier);
          if (o.dsoObservations && o.dsoObservations.length > 0) {
            const dsoShortLabels = [...o.dsoObservations]
              .sort(this.sortDsoObsByDisplayOrder)
              .map((dsoObs, dsoObsIndex) => {
                const targetKey = getObservedObjectTargetKey(o, index, dsoObs, dsoObsIndex);
                return (
                  <DsoShort
                    key={targetKey}
                    dso={dsoObs.dso}
                    nonDetection={dsoObs.nonDetection || o.nonDetection}
                    onNameClick={() => this.props.onSelectObservedObject(targetKey)}
                  />
                );
              });
            const unmatchedShortLabels = unmatchedLabels.map((label, unmatchedIndex) =>
              this.renderUnmatchedObservation(o, index, label, unmatchedIndex)
            );
            const objectLabels = [...dsoShortLabels, ...unmatchedShortLabels];
            if (objectLabels.length > 1) {
              return <div key={o.id ?? `observation-${index}`} className={classes.multipleDsoContainer}>{objectLabels}</div>;
            }
            return <div key={o.id ?? `observation-${index}`} className={classes.singleDsoContainer}>{objectLabels}</div>;
          }
          if (o.dsoObservations && o.dsoObservations.length === 0) {
            const unmatchedObservationLabels = this.getUnmatchedObservationLabels(o);
            if (unmatchedObservationLabels.length > 1) {
              return (
                <div key={o.id ?? `observation-${index}`} className={classes.multipleDsoContainer}>
                  {unmatchedObservationLabels.map((label, unmatchedIndex) =>
                    this.renderUnmatchedObservation(o, index, label, unmatchedIndex)
                  )}
                </div>
              );
            }
            return this.renderUnmatchedObservation(o, index, unmatchedObservationLabels[0]);
          }
          const errorText = "Err " + o.id;
          return <DsoShort key={index} error={errorText} />;
        });
    }
    const dsoList: any = dsoObjects.length > 0 ? dsoObjects : <Typography variant="caption" color="textSecondary" >No objects</Typography>;

    const locationOptions: IKeyValuePair[] = [{ key: "", value: "Select a location" }];
    if (this.props.locations) {
      const locations = this.props.locations;
      const locationOptionValues: IKeyValuePair[] = locations.map(l => ({ key: "" + l.id, value: l.name }));
      locationOptions.push(...locationOptionValues);
    }

    const instrumentOptions: IKeyValuePair[] = [{ key: "", value: "n/a" }];
    if (this.props.instruments) {
      const sortedInstruments = [...this.props.instruments].sort(this.sortInstrumentOptions);
      const instrumentOptionValues: IKeyValuePair[] = sortedInstruments.map(i => ({ key: "" + i.id, value: this.getInstrumentOptionLabel(i) }));
      instrumentOptions.push(...instrumentOptionValues);
    }
    const eyepieceKeyChipWidth = this.getReferenceKeyChipWidth(this.props.eyepieces || []);
    const instrumentKeyChipWidth = this.getReferenceKeyChipWidth(this.props.instruments || []);

    const seeingOptionValues: IKeyValuePair[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ key: "" + n, value: "" + n }));
    const seeingOptions: IKeyValuePair[] = [{ key: "", value: "n/a" }];
    seeingOptions.push(...seeingOptionValues);

    const transparencyOptionValues: IKeyValuePair[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ key: "" + n, value: "" + n }));
    const transparencyOptions: IKeyValuePair[] = [{ key: "", value: "n/a" }];
    transparencyOptions.push(...transparencyOptionValues);

    let circularProgress;
    if (this.props.isLoading) {
      circularProgress = <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />;
    }

    return (
      <div className="obsSessionForm">
        <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
          <Grid size="grow" container direction="column">
            <Grid>
              <TextField
                id="title"
                label="Title"
                value={this.state.obsSession.title || ""}
                onChange={this.handleChange("title")}
                className={classNames(classes.formControl, classes.textField)}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid>
              <TextField
                id="date"
                label="Date"
                type="date"
                value={this.state.obsSession.date}
                onChange={this.handleChange("date")}
                className={classNames(classes.formControl, classes.dateField)}
                margin="normal"
                size="small"
                variant="outlined"
              />
              <SelectComponent
                classes={classNames(classes.formControl, classes.selectInstrument)}
                label="Instrument"
                name="instrument"
                value={"" + (this.state.obsSession.instrumentId || "")}
                onChange={this.handleChange("instrumentId")}
                options={instrumentOptions}
                size="small"
              />
              <SelectComponent
                classes={classNames(classes.formControl, classes.selectLocation)}
                label="Location"
                name="location"
                value={"" + (this.state.obsSession.locationId || "")}
                onChange={this.handleChange("locationId")}
                options={locationOptions}
                size="small"
              />
            </Grid>
            <Grid>
              <TextField
                id="summary"
                label="Summary"
                multiline={true}
                maxRows={10}
                value={this.state.obsSession.summary || ""}
                onChange={this.handleChange("summary")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid>
              <TextField
                id="conditions"
                label="Conditions"
                multiline={true}
                maxRows={10}
                value={this.state.obsSession.conditions || ""}
                onChange={this.handleChange("conditions")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid className={classes.sessionBodyWrapper}>
              <Grid container direction="row" className={classes.sessionBodyRow}>
                <Grid container direction="column" className={classes.formFieldsColumn}>
                  <Grid>
                    <Grid container direction="row" className={classes.ratingSaveRow}>
                      <Grid className={classes.ratingControls}>
                        <SelectComponent
                          classes={classes.ratingSelect}
                          label="Seeing"
                          name="seeing"
                          value={"" + this.state.obsSession.seeing}
                          onChange={this.handleChange("seeing")}
                          options={seeingOptions}
                          margin="normal"
                          size="small"
                        />
                        <SelectComponent
                          classes={classes.ratingSelect}
                          label="Transparency"
                          name="transparency"
                          value={"" + this.state.obsSession.transparency}
                          onChange={this.handleChange("transparency")}
                          options={transparencyOptions}
                          margin="normal"
                          size="small"
                        />
                        <TextField
                          id="lm"
                          label="Lim. mag."
                          maxRows={10}
                          value={this.state.obsSession.limitingMagnitude || ""}
                          onChange={this.handleChange("limitingMagnitude")}
                          error={this.state.errorOnControl.limitingMagnitude !== undefined}
                          className={classes.ratingLimitingMagnitude}
                          margin="normal"
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid size="grow" className={classes.topActionColumn}>
                        <div>
                          {circularProgress}
                          <Button variant="contained" type="submit" disabled={!this.props.allowEditing} className={classes.bottomSaveButton}>
                            Save
                          </Button>
                        </div>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid>
                    <TextareaAutosize
                      id="reportText"
                      label="Report Text"
                      multiline={true}
                      value={this.state.obsSession.reportText || ""}
                      onChange={this.handleChange("reportText")}
                      className={classNames(classes.formControl, classes.reportTextField)}
                      inputProps={{ className: classes.textFieldReportText }}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  {this.props.errorMessage && (
                    <Grid>
                      <div role="alert" className={classes.formError}>
                        <Typography variant="body1" className={classes.formErrorText}>{this.props.errorMessage}</Typography>
                      </div>
                    </Grid>
                  )}
                  <Grid>
                    <Grid container direction="row" className={classes.helpReferenceRow}>
                      <Grid className={classes.helpTextColumn}>
                        <Typography variant="caption" color="textSecondary" component={"div" as any} className={classes.helpText}>
                          <div><code>!!</code>{" - "}section not found</div>
                          <div><code>!M 31!</code>{" - "}individual not found</div>
                          <div><code>(M 31)</code>{" - "}suppress reference</div>
                          <div><code>-1 +1 +2 * **</code>{" - "}rating</div>
                          <div><code>revisit</code>{" / "}<code>come back</code>{" - "}follow-up</div>
                          <div><code>Link: Image: Sketch: Jot:</code>{" - "}+ url</div>
                        </Typography>
                      </Grid>
                      <Grid className={classes.equipmentActionGrid}>
                        <Grid className={classNames(classes.keyReferenceColumn, classes.eyepieceReferenceColumn)}>
                          {this.renderKeyReferenceSection("Eyepieces", this.props.eyepieces || [], classes.eyepieceKeyGrid, eyepieceKeyChipWidth)}
                        </Grid>
                        <Grid className={classNames(classes.keyReferenceColumn, classes.instrumentReferenceColumn)}>
                          {this.renderKeyReferenceSection("Instruments", this.props.instruments || [], classes.instrumentKeyGrid, instrumentKeyChipWidth)}
                        </Grid>
                        <Grid className={classes.bottomActionColumn}>
                          <div>
                            <Button variant="contained" type="submit" disabled={!this.props.allowEditing} className={classes.bottomSaveButton}>
                              Save
                            </Button>
                            {circularProgress}
                          </div>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid className={classes.objectListColumn}>
                  <Typography variant="caption" color="textSecondary" component={"div" as any} className={classes.objectListHeading}>
                    Objects:
                  </Typography>
                  {dsoList}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(ObsSessionForm);
