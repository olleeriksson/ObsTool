import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextField";
import DsoShort from "./DsoShort";
import { IObsSession, ILocation, IObservation, IDsoObservation } from "../types/Types";
import classNames from "classnames";
import Grid from "@mui/material/Grid2";
import SelectComponent, { IKeyValuePair } from "./SelectComponent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

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
  textField: {
  },
  textFieldMultiLine: {
    height: 100,
  },
  textFieldReportText: {
    overflow: "hidden"  // gets rid of an annoying scroll bar in the report text form field
  },
  saveButton: {
    marginRight: 150,
  },
  dateField: {
    width: 200,
  },
  selectLocation: {
    width: 300,
    marginRight: theme.spacing(2),
  },
  select: {
    width: 100,
    marginRight: theme.spacing(2),
  },
  singleDsoContainer: {
    marginBottom: "0.7em",
    marginTop: "0.7em"
  },
  multipleDsoContainer: {
    //border: "1px dashed lightgray",
    marginBottom: "0.7em",
    marginTop: "0.7em"
  }
});

export interface IObsSessionFormProps extends WithStyles<typeof styles> {
  obsSession: IObsSession;
  locations?: ILocation[];
  onSaveObsSession: (obsSession: IObsSession) => void;
  isLoading: boolean;
  allowEditing: boolean;
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
        summary: "",
        conditions: "",
        seeing: undefined,
        transparency: undefined,
        limitingMagnitude: undefined,
        reportText: "",
        dsoObjects: [],    // not sure
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public componentDidUpdate(prevProps: IObsSessionFormProps) {
    if (this.props.obsSession && this.props.obsSession !== prevProps.obsSession) {
      // Load from object
      this.setState({ obsSession: this.props.obsSession });
    }
  }

  public componentDidMount() {
    if (this.props.obsSession) {
      // Load from object
      this.setState({ obsSession: this.props.obsSession });
    }
  }

  private handleSubmit(e: any) {
    e.preventDefault();
    this.props.onSaveObsSession(this.state.obsSession);
  }

  private handleChange = (name: string) => (event: any) => {
    const newValue = event.target.value;
    this.setState((prevState, props) => ({
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

  public render() {
    const { classes } = this.props;

    let dsoObjects: any = [];
    if (this.state.obsSession.observations) {
      dsoObjects = this.state.obsSession.observations
        .sort(this.sortObsByDisplayOrder)
        .map((o, index) => {
          if (o.dsoObservations) {
            const dsoShortLabels = o.dsoObservations
              .sort(this.sortDsoObsByDisplayOrder)
              .map(dsoObs =>
                <DsoShort key={dsoObs.dso.id} dso={dsoObs.dso} customObjectName={dsoObs.customObjectName} nonDetection={dsoObs.nonDetection || o.nonDetection} />
              );
            if (o.dsoObservations.length > 1) {
              // Show many
              return <div key={o.id} className={classes.multipleDsoContainer}>{dsoShortLabels}</div>;
            } else {
              // Show one
              return <div key={o.id} className={classes.singleDsoContainer}>{dsoShortLabels}</div>;
            }
          } else {
            const errorText = "Err " + o.id;
            return <DsoShort key={index} error={errorText} />;
          }
        });
    }
    const dsoList: any = dsoObjects.length > 0 ? dsoObjects : <Typography variant="caption" color="textSecondary" >No objects</Typography>;

    const locationOptions: IKeyValuePair[] = [{ key: "", value: "Select a location" }];
    if (this.props.locations) {
      const locations = this.props.locations;
      const locationOptionValues: IKeyValuePair[] = locations.map(l => ({ key: "" + l.id, value: l.name }));
      locationOptions.push(...locationOptionValues);
    }

    const seeingOptionValues: IKeyValuePair[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ key: "" + n, value: "" + n }));
    const seeingOptions: IKeyValuePair[] = [{ key: "", value: "n/a" }];
    seeingOptions.push(...seeingOptionValues);

    const transparencyOptionValues: IKeyValuePair[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ key: "" + n, value: "" + n }));
    const transparencyOptions: IKeyValuePair[] = [{ key: "", value: "n/a" }];
    transparencyOptions.push(...transparencyOptionValues);

    let circularProgress;
    if (this.props.isLoading) {
      circularProgress = (
        <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />
      );
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
                classes={classNames(classes.formControl, classes.selectLocation)}
                label="Location"
                name="location"
                value={"" + this.state.obsSession.locationId}
                onChange={this.handleChange("locationId")}
                options={locationOptions}
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
                margin="normal"
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
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid>
              <SelectComponent
                classes={classNames(classes.formControl, classes.select)}
                label="Seeing"
                name="seeing"
                value={"" + this.state.obsSession.seeing}
                onChange={this.handleChange("seeing")}
                options={seeingOptions}
              />
              <SelectComponent
                classes={classNames(classes.formControl, classes.select)}
                label="Transparency"
                name="transparency"
                value={"" + this.state.obsSession.transparency}
                onChange={this.handleChange("transparency")}
                options={transparencyOptions}
              />
              <TextField
                id="lm"
                label="Limiting magnitude"
                maxRows={10}
                value={this.state.obsSession.limitingMagnitude || ""}
                onChange={this.handleChange("limitingMagnitude")}
                error={this.state.errorOnControl.limitingMagnitude !== undefined}
                className={classNames(classes.formControl)}
                margin="normal"
                variant="outlined"
                style={{ width: 180 }}
              />
            </Grid>
            <Grid>
              <Grid container direction="row">
                <Grid size="grow">
                  <Grid container direction="column">
                    <Grid size="grow">
                      <Grid container direction="row" justifyContent="flex-end">
                        {circularProgress}
                        <Button
                          variant="contained"
                          type="submit"
                          disabled={!this.props.allowEditing}
                          className={classes.saveButton}
                        >
                          Save
                        </Button>
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
                    <Grid>
                      <Grid container direction="row" justifyContent="flex-end">
                        <Grid>
                          {circularProgress}
                          <Button
                            variant="contained"
                            type="submit"
                            disabled={!this.props.allowEditing}
                            className={classes.saveButton}
                          >
                            Save
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={1}>
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
