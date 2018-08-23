import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import "./ObsSessionForm.css";
import DsoShort from "./DsoShort";
import axios from "axios";
import { IObsSession, ILocation } from "./Types";
import classNames from "classnames";
import Grid from "@material-ui/core/Grid";
import SelectComponent, { IKeyValuePair } from "./SelectComponent";
import Typography from "@material-ui/core/Typography";

const styles = (theme: Theme) => createStyles({
  form: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: "90%",
  },
  textField: {
  },
  textFieldMultiLine: {
    height: 100,
  },
  textFieldReportText: {
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
});

export interface IObsSessionFormProps extends WithStyles<typeof styles> {
  obsSessionId?: number;
  obsSession?: IObsSession;
  locations?: ILocation[];
  onSaveObsSession: (obsSession: IObsSession) => void;
}

export interface IObsSessionFormState {
  isLoading: boolean;
  isError: boolean;
  errorOnControl: { [key: string]: string | undefined };
  obsSession: IObsSession;
}

class ObsSessionForm extends React.Component<IObsSessionFormProps, IObsSessionFormState> {
  constructor(props: IObsSessionFormProps) {
    super(props);

    this.state = {
      isLoading: true,
      isError: false,
      errorOnControl: {},
      obsSession: {
        title: "",
        date: new Date().toISOString().slice(0, 10),
        summary: "",
        conditions: "",
        seeing: 0,
        limitingMagnitude: 0,
        dsoObjects: [],    // not sure
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  private loadObsSessionFromId(obsSessionId?: number) {
    if (obsSessionId) {
      axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeObservations=true&includeDso=true").then(
        response => {
          console.log(response);
          this.setState({ isLoading: false });
          this.setState({ obsSession: response.data });
        },
        () => {
          this.setState({ isError: true });
        }
      );
    }
  }

  public componentWillReceiveProps(nextProps: IObsSessionFormProps) {
    if (nextProps.obsSessionId && this.props.obsSessionId !== nextProps.obsSessionId) {
      // Load from id
      this.loadObsSessionFromId(nextProps.obsSessionId);
    } else if (nextProps.obsSession && this.props.obsSession !== nextProps.obsSession) {
      // Load from object
      this.setState({ obsSession: nextProps.obsSession });
    }
  }

  public componentDidMount() {
    if (this.props.obsSessionId) {
      // Load from id
      this.loadObsSessionFromId(this.props.obsSessionId);
    } else if (this.props.obsSession) {
      // Load from object
      this.setState({ obsSession: this.props.obsSession });
    }
  }

  private handleSubmit(e: any) {
    e.preventDefault();

    if (this.state.obsSession.title === "" || this.state.obsSession.summary === "") {
      alert("Must fill in title and summary");
    } else {
      console.log("Title: " + this.state.obsSession.title + ", Summary: " + this.state.obsSession.summary);
      this.props.onSaveObsSession(this.state.obsSession);
    }
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

  public render() {
    const { classes } = this.props;

    let dsoObjects: any = [];
    if (this.state.obsSession.observations) {
      dsoObjects = this.state.obsSession.observations.map((o, index) => {
        if (o.dso) {
          return <DsoShort key={o.dso.id} dso={o.dso} />;
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

    return (
      <div className="obsSessionForm">
        <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
          <Grid container={true} direction="column">
            <Grid item={true} >
              <TextField
                id="title"
                label="Title"
                value={this.state.obsSession.title}
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
                multiline={false}
                rowsMax="10"
                value={this.state.obsSession.summary}
                onChange={this.handleChange("summary")}
                className={classNames(classes.formControl, classes.textField)}
                margin="dense"
              />
            </Grid>
            <Grid item={true}>
              <TextField
                id="conditions"
                label="Conditions"
                multiline={false}
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
            </Grid>
            <Grid container={true}>
              <Grid item={true} xs={11}>
                <TextField
                  id="reportText"
                  label="Report Text"
                  multiline={true}
                  rowsMax="100"
                  value={this.state.obsSession.reportText || ""}
                  onChange={this.handleChange("reportText")}
                  className={classNames(classes.formControl, classes.textFieldReportText)}
                  margin="dense"
                />
              </Grid>
              <Grid item={true} xs={1}>
                {dsoList}
              </Grid>
            </Grid>
            <Grid item={true}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(ObsSessionForm);
