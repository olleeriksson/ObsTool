import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import TextareaAutosize from "@material-ui/core/TextField";
import DsoShort from "./DsoShort";
import { IObsSession, ILocation, IObservation, IDsoObservation } from "../types/Types";
import classNames from "classnames";
import Grid from "@material-ui/core/Grid";
import SelectComponent, { IKeyValuePair } from "./SelectComponent";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme: Theme) => createStyles({
  form: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
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
  dateField: {
    width: 200,
  },
  selectLocation: {
    marginTop: theme.spacing.unit * 2,
    width: 300,
  },
  select: {
    marginTop: theme.spacing.unit * 2,
    width: 100,
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
                <DsoShort key={dsoObs.dso.id} dso={dsoObs.dso} customObjectName={dsoObs.customObjectName} />
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
          <Grid container={true} direction="column">
            <Grid item={true} >
              <TextField
                id="title"
                label="Title"
                value={this.state.obsSession.title || ""}
                onChange={this.handleChange("title")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
              />
            </Grid>
            <Grid item={true}>
              <TextField
                id="date"
                label="Date"
                type="date"
                value={this.state.obsSession.date}
                onChange={this.handleChange("date")}
                className={classNames(classes.formControl, classes.dateField)}
                margin="dense"
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
            <Grid item={true}>
              <TextField
                id="summary"
                label="Summary"
                multiline={true}
                rowsMax="10"
                value={this.state.obsSession.summary || ""}
                onChange={this.handleChange("summary")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
              />
            </Grid>
            <Grid item={true}>
              <TextField
                id="conditions"
                label="Conditions"
                multiline={true}
                rowsMax="10"
                value={this.state.obsSession.conditions || ""}
                onChange={this.handleChange("conditions")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
              />
            </Grid>
            <Grid item={true}>
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
                rowsMax="10"
                value={this.state.obsSession.limitingMagnitude || ""}
                onChange={this.handleChange("limitingMagnitude")}
                error={this.state.errorOnControl.limitingMagnitude !== undefined}
                className={classNames(classes.formControl)}
                margin="normal"
                style={{ width: 150 }}
              />
              <Grid item={true}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                >
                  Save
                </Button>
                {circularProgress}
              </Grid>
            </Grid>
            <Grid item={true}>
              <Grid container={true} direction="row">
                <Grid item={true} style={{ flex: 1 }}>
                  <Grid container={true} direction="column">
                    <Grid item={true}>
                      <TextareaAutosize
                        id="reportText"
                        label="Report Text"
                        multiline={true}
                        value={this.state.obsSession.reportText || ""}
                        onChange={this.handleChange("reportText")}
                        className={classNames(classes.formControl)}
                        inputProps={{ className: classes.textFieldReportText }}
                      />
                    </Grid>
                    <Grid item={true}>
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                      >
                        Save
                      </Button>
                      {circularProgress}
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item={true} xs={1}>
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
