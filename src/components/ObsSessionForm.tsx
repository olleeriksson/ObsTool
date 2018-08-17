import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import "./ObsSessionForm.css";
import DsoExtended from "./DsoExtended";
import axios from "axios";
import { IObsSession } from "./Types";

export interface IObsSessionFormProps {
  obsSessionId?: number;
  onSaveObservation: any;  // !!!!!!!!!!!!!!!!
}

export interface IObsSessionFormState {
  isLoading: boolean;
  isError: boolean;
  obsSession: IObsSession;
}

class ObsSessionForm extends React.Component<IObsSessionFormProps, IObsSessionFormState> {
  constructor(props: IObsSessionFormProps) {
    super(props);

    this.state = {
      isLoading: true,
      isError: false,
      obsSession: {
        title: "",
        date: new Date().toISOString().slice(0, 10),
        summary: "",
        dsoObjects: [],    // not sure
      }
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  private loadData(obsSessionId?: number) {
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
    if (this.props.obsSessionId !== nextProps.obsSessionId) {
      this.loadData(nextProps.obsSessionId);
    }
  }

  public componentDidMount() {
    this.loadData(this.props.obsSessionId);
  }

  private handleSubmit(e: any) {
    e.preventDefault();

    if (this.state.obsSession.title === "" || this.state.obsSession.summary === "") {
      alert("Must fill in title and summary");
    } else {
      console.log("Title: " + this.state.obsSession.title + ", Summary: " + this.state.obsSession.summary);
      this.props.onSaveObservation(this.state.obsSession);
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

    let dsoObjects: any = [];
    if (this.state.obsSession.observations) {
      dsoObjects = this.state.obsSession.observations.map(o => {
        return <DsoExtended key={o.dso.id} id={o.dso.id} />;
      });
    }
    const dsoList: any = dsoObjects.length > 0 ? dsoObjects : <div>None</div>;

    return (
      <div className="obsSessionForm">
        <h3>Observation</h3>
        <form onSubmit={this.handleSubmit}>
          <div>
            <TextField
              id="name"
              label="Title"
              value={this.state.obsSession.title}
              onChange={this.handleChange("title")}
              margin="normal"
            />
            <TextField
              id="date"
              label="Date"
              type="date"
              defaultValue={this.state.obsSession.date}
              onChange={this.handleChange("date")}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              id="summary"
              multiline={true}
              label="Summary"
              value={this.state.obsSession.summary}
              onChange={this.handleChange("summary")}
              margin="normal"
            />
          </div>

          <h4>Observed objects</h4>
          {dsoList}

          <Button
            variant="contained"
            color="primary"
            type="submit"
          >
            Save
          </Button>
        </form>
      </div>
    );
  }
}

export default ObsSessionForm;
