import * as React from "react";
import "./ObsSessionPreview.css";

export interface IObsSessionPreviewProps {
  id: number;
  title: string;
  date: string;
  summary: string;
  onSelectObsSessionPreview: (obsSessionId: number) => void;
}

class ObsSessionPreview extends React.Component<IObsSessionPreviewProps> {
  constructor(props: IObsSessionPreviewProps) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  public onClick() {
    console.log("Clicked on the div");
    this.props.onSelectObsSessionPreview(this.props.id);
  }

  public render() {
    return (
      <div className="obsSessionPreview" onClick={this.onClick}>
        <div><strong>{this.props.title}</strong></div>
        <div><strong>Date:</strong> {this.props.date}</div>
        <div><strong>Summary:</strong> {this.props.summary}</div>
      </div>
    );
  }
}

export default ObsSessionPreview;
