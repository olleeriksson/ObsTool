import * as React from "react";
import GoogleDriveImage from "./GoogleDriveImage";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";

interface IResourceImageProps extends WithStyles<typeof styles> {
    type: string;
    name?: string;
    url?: string;
    // In case of images/sketches:
    driveMaxWidth?: string;
    driveMaxHeight?: string;
}

const styles = (theme: Theme) => createStyles({
    image: {
        width: "100%",
        // height: "auto"
    },
});

class ResourceImage extends React.PureComponent<IResourceImageProps> {
    constructor(props: IResourceImageProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        if (this.props.type === "sketch") {
            const imageId = this.props.url;  // the google image id is stored in the url field
            return <GoogleDriveImage
                imageId={imageId}
                title={this.props.name}
                driveMaxWidth={this.props.driveMaxWidth || "100"}
                driveMaxHeight={this.props.driveMaxHeight || "100"}
            />;
        } else if (this.props.type === "image") {
            return <img src={this.props.url} title={this.props.name} className={classes.image} />;
        } else {
            return <a href={this.props.url} title={this.props.name}>{this.props.name}</a>;
        }
    }
}

export default withStyles(styles)(ResourceImage);