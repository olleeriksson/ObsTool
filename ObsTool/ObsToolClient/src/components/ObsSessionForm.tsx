import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
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
  saveButton: {
    marginRight: `calc(5% - ${theme.spacing(1)})`,
  },
  ratingSaveRow: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "95%",
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
    borderLeft: "3px solid #b26a00",
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
    backgroundColor: "#fff5f5",
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
  objectListColumn: {
    paddingTop: theme.spacing(5),
  },
  objectListHeading: {
    fontWeight: 900,
    fontSize: "0.95rem",
    fontStyle: "underline",
    marginBottom: theme.spacing(1.5),
  },
  helpReferenceRow: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: "95%",
    alignItems: "flex-start",
    columnGap: theme.spacing(1.5),
    flexWrap: "nowrap",
  },
  helpTextColumn: {
    flex: "0 0 390px",
    maxWidth: 390,
  },
  helpText: {
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  },
  bottomActionColumn: {
    display: "flex",
    justifyContent: "flex-end",
    flex: "0 0 68px",
    marginLeft: "auto",
  },
  keyReferenceColumn: {
    lineHeight: 1.35,
  },
  eyepieceReferenceColumn: {
    flex: "0 0 170px",
    maxWidth: 170,
  },
  instrumentReferenceColumn: {
    flex: "0 0 100px",
    maxWidth: 100,
  },
  keyChipGrid: {
    display: "grid",
    gap: theme.spacing(0.5),
  },
  eyepieceKeyGrid: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  instrumentKeyGrid: {
    gridTemplateColumns: "1fr",
  },
  referenceSection: {
    marginBottom: theme.spacing(1),
  },
  referenceHeading: {
    fontWeight: 700,
  },
  keyChip: {
    border: "1px solid #d4d4d4",
    borderRadius: 4,
    backgroundColor: "#f1f1f1",
    color: theme.palette.text.primary,
    cursor: "pointer",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "0.78rem",
    lineHeight: 1.2,
    padding: "2px 5px",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
      }
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

  private sortByKey = <T extends { key: string }>(itemA: T, itemB: T) => {
    return itemA.key.localeCompare(itemB.key);
  }

  private copyKeyToClipboard = (key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key);
    }
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

  private getEyepieceTooltip = (eyepiece: IEyepiece) => {
    const focalLengthText = eyepiece.focalLengthMm ? ` (${eyepiece.focalLengthMm} mm)` : "";
    return `${eyepiece.name}${focalLengthText}\nClick to copy`;
  }

  private getInstrumentTooltip = (instrument: IInstrument) => {
    return `${instrument.name}\nClick to copy`;
  }

  private renderKeyReferenceSection = <T extends { id?: number; key: string }>(
    title: string,
    items: T[],
    getTooltip: (item: T) => string,
    gridClassName: string
  ) => {
    // Keys are compact editing aids; names stay in the tooltip so the visible surface is easy to scan.
    const sortedItems = [...items].sort(this.sortByKey);
    const content = sortedItems.length === 0 ? (
      <Typography variant="caption" color="textSecondary">None</Typography>
    ) : (
      <div className={classNames(this.props.classes.keyChipGrid, gridClassName)}>
        {sortedItems.map(item => (
          <Tooltip
            key={item.id || item.key}
            arrow={true}
            placement="top"
            title={<span style={{ whiteSpace: "pre-line" }}>{getTooltip(item)}</span>}
          >
            <button
              type="button"
              className={this.props.classes.keyChip}
              onClick={() => this.copyKeyToClipboard(item.key)}
            >
              {item.key}
            </button>
          </Tooltip>
        ))}
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
                    customObjectName={dsoObs.customObjectName}
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
      const sortedInstruments = [...this.props.instruments].sort((a, b) => a.key.localeCompare(b.key));
      const instrumentOptionValues: IKeyValuePair[] = sortedInstruments.map(i => ({ key: "" + i.id, value: `${i.key} - ${i.name}` }));
      instrumentOptions.push(...instrumentOptionValues);
    }

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
                variant="outlined"
              />
              <SelectComponent
                classes={classNames(classes.formControl, classes.selectInstrument)}
                label="Instrument"
                name="instrument"
                value={"" + (this.state.obsSession.instrumentId || "")}
                onChange={this.handleChange("instrumentId")}
                options={instrumentOptions}
              />
            </Grid>
            <Grid>
              <SelectComponent
                classes={classNames(classes.formControl, classes.selectLocation)}
                label="Location"
                name="location"
                value={"" + (this.state.obsSession.locationId || "")}
                onChange={this.handleChange("locationId")}
                options={locationOptions}
                margin="dense"
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
                variant="outlined"
              />
            </Grid>
            <Grid>
              <Grid container direction="row">
                <Grid size="grow">
                  <Grid container direction="column">
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
                          />
                          <SelectComponent
                            classes={classes.ratingSelect}
                            label="Transparency"
                            name="transparency"
                            value={"" + this.state.obsSession.transparency}
                            onChange={this.handleChange("transparency")}
                            options={transparencyOptions}
                            margin="normal"
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
                        className={classNames(classes.formControl)}
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
                        <Grid className={classNames(classes.keyReferenceColumn, classes.eyepieceReferenceColumn)}>
                          {this.renderKeyReferenceSection("Eyepieces", this.props.eyepieces || [], this.getEyepieceTooltip, classes.eyepieceKeyGrid)}
                        </Grid>
                        <Grid className={classNames(classes.keyReferenceColumn, classes.instrumentReferenceColumn)}>
                          {this.renderKeyReferenceSection("Instruments", this.props.instruments || [], this.getInstrumentTooltip, classes.instrumentKeyGrid)}
                        </Grid>
                        <Grid size="grow" className={classes.bottomActionColumn}>
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
                <Grid size={1} className={classes.objectListColumn}>
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
