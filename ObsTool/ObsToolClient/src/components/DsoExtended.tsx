import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import { IDso } from "../types/Types";
import Typography from "@material-ui/core/Typography";
import CosmosIcon from "../cosmos.svg";
import DsoAnnotations from "./DsoAnnotations";
import GoogleImagesLink from "./GoogleImagesLink";
import * as obsToolUtils from "../obsToolUtils";
import AladinLiteLink from "./AladinLiteLink";

export interface IDsoExtendedProps {
  id?: number;
  customObjectName?: string;
  error?: string;
  dso?: IDso;
}

export interface IDsoExtendedState {
  isMounted: boolean;
  isLoading: boolean;
  isError: boolean;
  dso?: IDso;
}

export default class DsoExtended extends React.Component<IDsoExtendedProps, IDsoExtendedState> {
  constructor(props: IDsoExtendedProps) {
    super(props);
    this.state = {
      isMounted: false,
      isLoading: true,
      isError: false,
      dso: undefined,
    };
  }

  public componentDidMount() {
    // If the object is provided, don't load anything.
    if (this.props.dso) {
      this.setState({ isLoading: false });
      this.setState({ isError: false });
    } else {
      this.setState({ isLoading: false });
      this.setState({ isError: true });
    }
  }

  public render() {
    if (this.props.error) {
      return (
        <Typography color="error" gutterBottom={true}>
          {this.props.error}
        </Typography>
      );
    } else if (this.state.isLoading) {
      return (
        <div>
          <CircularProgress />Loading DSO object
        </div>
      );
    } else if (this.state.isError) {
      return (
        <Typography color="textSecondary" gutterBottom={true}>
          Error!
        </Typography>
      );
    } else {
      if (this.props.dso) {
        const otherNames = this.props.dso.otherNames && this.props.dso.otherNames.trim() !== "" && "(" + this.props.dso.otherNames + ")";
        const commonName = this.props.dso.commonName && (" - " + this.props.dso.commonName);
        const sizeSeparator = this.props.dso.sizeMax && this.props.dso.sizeMax.trim() !== "" && this.props.dso.sizeMin && this.props.dso.sizeMin.trim() !== "" && " - ";

        // Prepare a search terms for Google image search
        const translatedDsoType = obsToolUtils.translateDsoType(this.props.dso.type);
        const searchTerms = [this.props.dso.name || "", translatedDsoType || ""];

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
              <Typography variant="body2" gutterBottom={false}>
                <img src={CosmosIcon} width="18" height="18" /> {this.props.dso.name} {otherNames} {commonName}
                <span style={{ marginLeft: "1em" }} />
                <DsoAnnotations
                  rating={this.props.dso.dsoExtra && this.props.dso.dsoExtra.rating}
                  followUp={this.props.dso.dsoExtra && this.props.dso.dsoExtra.followUp}
                />
              </Typography>
              <div style={{ marginLeft: "1.5em" }}>
                <Typography variant="caption" color="textSecondary" gutterBottom={true}>
                  <strong>Type:</strong> {this.props.dso.type} &nbsp;
                  <strong>Const:</strong> {this.props.dso.con} &nbsp;
                  <strong>Mag:</strong> {this.props.dso.mag} &nbsp;
                  <strong>SB:</strong> {this.props.dso.sb} &nbsp;
                  <strong>Class:</strong> {this.props.dso.class} &nbsp;
                  <strong>Dreyer:</strong> {this.props.dso.dreyerDesc} &nbsp;
                  <strong>Size:</strong> {this.props.dso.sizeMax} {sizeSeparator} {this.props.dso.sizeMin} &nbsp;
                  <strong>Notes:</strong> {this.props.dso.notes} &nbsp;|&nbsp;
                  <GoogleImagesLink linkTitle="Google image search" searchTerms={searchTerms} /> &nbsp;|&nbsp;
                  <AladinLiteLink linkTitle="Aladin Lite" searchTerm={this.props.dso.name} />
                </Typography>
              </div>
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
