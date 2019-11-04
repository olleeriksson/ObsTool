import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@material-ui/core/Typography";
import CosmosIcon from "../cosmos.svg";

export interface IDsoExtendedProps {
  id?: number;
  customObjectName?: string;
  error?: string;
  dso?: IDso;
}

export default class DsoExtended extends React.Component<IDsoExtendedProps> {
  constructor(props: IDsoExtendedProps) {
    super(props);
  }

  public componentDidMount() {
  }

  public render() {
    if (this.props.error) {
      return (
        <Typography color="error" gutterBottom={true}>
          {this.props.error}
        </Typography>
      );
    } else {
      if (this.props.dso) {
        const sizeSeparator = this.props.dso.sizeMax && this.props.dso.sizeMax.trim() !== "" && this.props.dso.sizeMin && this.props.dso.sizeMin.trim() !== "" && " - ";

        if (this.props.dso.name === "custom") {
          return (
            <div className="dsoExtended">
              <Typography variant="subtitle1">
                <img src={CosmosIcon} width="20" height="20" /> Custom object: {this.props.customObjectName}
              </Typography>
            </div>
          );
        } else {
          return (
            <div className="dsoExtended">
              <Typography variant="caption" color="textSecondary" gutterBottom={true} style={{ marginLeft: "1.8em" }}>
                <strong>Type:</strong> {this.props.dso.type} &nbsp;
                <strong>Const:</strong> {this.props.dso.con} &nbsp;
                <strong>Mag:</strong> {this.props.dso.mag} &nbsp;
                <strong>SB:</strong> {this.props.dso.sb} &nbsp;
                <strong>Class:</strong> {this.props.dso.class} &nbsp;
                <strong>Dreyer:</strong> {this.props.dso.dreyerDesc} &nbsp;
                <strong>Size:</strong> {this.props.dso.sizeMax} {sizeSeparator} {this.props.dso.sizeMin} &nbsp;
                <strong>Notes:</strong> {this.props.dso.notes} &nbsp;
              </Typography>
            </div>
          );
        }
      } else {
        return (
          <Typography color="textSecondary" gutterBottom={true}>
            Unable to load DSO object!
          </Typography>
        );
      }
    }
  }
}
