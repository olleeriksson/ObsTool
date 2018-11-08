import * as React from "react";
//import GoogleDriveImage from "./GoogleDriveImage";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";

interface IResourceImageProps extends WithStyles<typeof styles> {
    type: string;
    name?: string;
    url?: string;
    // In case of images/sketches:
    inverted?: boolean;
    rotation?: number;
    backgroundColor?: number;
    driveMaxWidth?: string;
    driveMaxHeight?: string;
}

const styles = (theme: Theme) => createStyles({
    imageContainer: {
        overflow: "hidden",
        //backgroundColor: "rgb(0,0,0)"
        // height: "auto"
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
            return <a href={this.props.url} title={this.props.name}>{this.props.name} </a>;
        } else {
            const invert = this.props.inverted ? "100" : "0";
            const rotation = this.props.rotation;
            const backgroundColor = this.props.backgroundColor === 256 ? "white" : "black";
            let imgSrc;

            if (this.props.type === "sketch") {
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
                        style={{ transform: `rotate(${rotation}deg)`, filter: `invert(${invert}%)` }}
                    />
                </div>
            );
        }
    }
}

export default withStyles(styles)(ResourceImage);