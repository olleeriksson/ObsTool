import * as React from "react";
import ObsSessionPreview from "./ObsSessionPreview";
import { IObsSession } from "./Types";

export interface IObsSessionListProps {
  obsSessions: IObsSession[];
  onSelectObsSession: (obsSessionId: number) => void;
}

class ObsSessionList extends React.Component<IObsSessionListProps> {
  constructor(props: IObsSessionListProps) {
    super(props);

    this.onSelectObsSessionPreview = this.onSelectObsSessionPreview.bind(this);
  }

  private onSelectObsSessionPreview(obsSessionId: number) {
    console.log("Clicked on ObsSessionPreview");
    this.props.onSelectObsSession(obsSessionId);
  }

  public render() {
    if (this.props.obsSessions) {
      return this.props.obsSessions.map(o => (
        <ObsSessionPreview
          onSelectObsSessionPreview={this.onSelectObsSessionPreview}
          key={o.id}
          id={o.id || -1}
          title={o.title}
          date={o.date}
          summary={o.summary || ""}
        />));
    } else {
      return <div>Unable to load observation session</div>;
    }
  }
}

export default ObsSessionList;
