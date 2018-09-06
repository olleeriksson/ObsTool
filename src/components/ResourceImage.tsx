import * as React from "react";
import GoogleDriveImage from "./GoogleDriveImage";

interface IResourceImageProps {
    type: string;
    name?: string;
    url?: string;
    // In case of images/sketches:
    maxWidth?: string;
    maxHeight?: string;
}

class ResourceImage extends React.PureComponent<IResourceImageProps> {
    constructor(props: IResourceImageProps) {
        super(props);
    }

    public render() {
        if (this.props.type === "sketch") {
            const imageId = this.props.url;  // the google image id is stored in the url field
            return <GoogleDriveImage imageId={imageId} title={this.props.name} maxWidth={this.props.maxWidth || "1000"} maxHeight={this.props.maxHeight || "1000"} />;
        } else if (this.props.type === "image") {
            console.log("Max width: " + this.props.maxWidth);
            return <div style={{ maxWidth: this.props.maxWidth }} >
                    <img src={this.props.url} title={this.props.name} style={{ maxWidth: this.props.maxWidth }} />
                </div>;
        } else {
            return <a href={this.props.url} title={this.props.name}>{this.props.name}</a>;
        }
    }
}

export default ResourceImage;
