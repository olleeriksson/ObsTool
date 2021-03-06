import * as React from "react";
//import GoogleDriveImage from "./GoogleDriveImage";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import AladinLiteFrame from "./AladinLiteFrame";

interface IResourceImageProps extends WithStyles<typeof styles> {
    type: string;
    name?: string;
    url?: string;
    // In case of images/sketches:
    inverted?: boolean;
    rotation?: number;
    zoomLevel: number;
    backgroundColor?: number;
    driveMaxWidth?: string;
    driveMaxHeight?: string;
    preview?: boolean;
}

const styles = (theme: Theme) => createStyles({
    imageContainer: {
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch"
    },
    image: {
        width: "100%",
        // height: "auto"
    },
});

class ResourceImage extends React.PureComponent<IResourceImageProps> {
    private imgRef: React.RefObject<HTMLImageElement>;
    private imgContainerRef: React.RefObject<HTMLDivElement>;

    constructor(props: IResourceImageProps) {
        super(props);
        this.imgRef = React.createRef();
    }

    public componentDidMount() {
        // const rgb = this.getAverageRGB(this.imgRef.current);
        // if (this.imgContainerRef && this.imgContainerRef.current) {
        //     this.imgContainerRef.current.style.backgroundColor = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        // }
    }

    // private getAverageRGB = (imgEl: any) => {

    //     const blockSize = 5; // only visit every 5 pixels
    //     const defaultRGB = { r: 128, g: 128, b: 128 }; // for non-supporting envs
    //     const canvas = document.createElement("canvas");
    //     const context = canvas.getContext && canvas.getContext("2d");
    //     let data;
    //     let width;
    //     let height;
    //     let length;
    //     const rgb = { r: 0, g: 0, b: 0 };
    //     let count = 0;

    //     if (!context) {
    //         return defaultRGB;
    //     }

    //     height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    //     width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    //     context.drawImage(imgEl, 0, 0);

    //     try {
    //         data = context.getImageData(0, 0, width, height);
    //     } catch (e) {
    //         /* security error, because of CORS security */
    //         //alert("x");
    //         return defaultRGB;
    //     }

    //     length = data.data.length;

    //     let i = -4;
    //     i += blockSize * 4;
    //     while (i < length) {
    //         ++count;
    //         rgb.r += data.data[i];
    //         rgb.g += data.data[i + 1];
    //         rgb.b += data.data[i + 2];
    //         i += blockSize * 4;
    //     }

    //     // ~~ used to floor values
    //     rgb.r = ~~(rgb.r / count);
    //     rgb.g = ~~(rgb.g / count);
    //     rgb.b = ~~(rgb.b / count);

    //     return rgb;
    // }

    public render() {
        const { classes } = this.props;

        if (this.props.type === "url") {
            const displayName = this.props.name || this.props.url;
            return (
                <a href={this.props.url} title={displayName}>{displayName} </a>
            );
        } else if (this.props.type === "aladin") {
            const aladinTargetName = this.props.url;  // the Aladin target name is stored in the url field
            const driveMaxWidth = this.props.driveMaxWidth || "100";
            const driveMaxHeight = this.props.driveMaxHeight || "100";
            if (!!this.props.preview) {
                return <img src="aladin.png" />;
            }
            return (
                <AladinLiteFrame target={aladinTargetName} width={"550"} height={"550"} />
            );
        } else {
            const invert = this.props.inverted ? "100" : "0";
            const rotation = this.props.rotation;
            const scale = this.props.zoomLevel / 100;
            const backgroundColor = this.props.backgroundColor && this.props.backgroundColor >= 255 ? "white" : "black";
            let imgSrc;

            if (this.props.type === "sketch" || this.props.type === "jot") {
                const imageId = this.props.url;  // the google image id is stored in the url field
                const driveMaxWidth = this.props.driveMaxWidth || "100";
                const driveMaxHeight = this.props.driveMaxHeight || "100";
                imgSrc = "https://drive.google.com/thumbnail?id=" + imageId + "&sz=w" + driveMaxWidth + "-h" + driveMaxHeight;
            } else if (this.props.type === "image") {
                imgSrc = this.props.url;
            }

            return (
                <div
                    ref={this.imgContainerRef}
                    className={classes.imageContainer}
                    style={{ backgroundColor: `${backgroundColor}` }}
                >
                    <img
                        //crossOrigin="anonymous"
                        ref={this.imgRef}
                        src={imgSrc}
                        title={this.props.name}
                        className={classes.image}
                        style={{ transform: `rotate(${rotation}deg) scale(${scale})`, filter: `invert(${invert}%)` }}
                    />
                </div>
            );
        }
    }
}

export default withStyles(styles)(ResourceImage);