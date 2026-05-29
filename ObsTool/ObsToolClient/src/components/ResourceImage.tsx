import * as React from "react";
//import GoogleDriveImage from "./GoogleDriveImage";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import AladinLiteFrame from "./AladinLiteFrame";

export interface IResourceImageBounds {
    naturalWidth: number;
    naturalHeight: number;
    imageLeft: number;
    imageTop: number;
    imageWidth: number;
    imageHeight: number;
    containerWidth: number;
    containerHeight: number;
}

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
    fitContainer?: boolean;
    preventUpscale?: boolean;
    onImageBoundsChange?: (bounds: IResourceImageBounds) => void;
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
    private resizeObserver?: ResizeObserver;

    constructor(props: IResourceImageProps) {
        super(props);
        this.imgRef = React.createRef();
        this.imgContainerRef = React.createRef();
    }

    public componentDidMount() {
        this.observeImageContainer();
        this.notifyImageBoundsChange();
        // const rgb = this.getAverageRGB(this.imgRef.current);
        // if (this.imgContainerRef && this.imgContainerRef.current) {
        //     this.imgContainerRef.current.style.backgroundColor = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        // }
    }

    public componentDidUpdate() {
        this.notifyImageBoundsChange();
    }

    public componentWillUnmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    // Watches the rendered image area so parent controls can stay aligned after dialog or viewport size changes.
    private observeImageContainer = () => {
        if (typeof ResizeObserver === "undefined" || !this.imgContainerRef.current) {
            return;
        }

        this.resizeObserver = new ResizeObserver(() => this.notifyImageBoundsChange());
        this.resizeObserver.observe(this.imgContainerRef.current);
    }

    // Reports the real rendered image rectangle relative to its bounded image container.
    private notifyImageBoundsChange = () => {
        if (!this.props.onImageBoundsChange || !this.imgRef.current || !this.imgContainerRef.current) {
            return;
        }

        const imageRect = this.imgRef.current.getBoundingClientRect();
        const containerRect = this.imgContainerRef.current.getBoundingClientRect();
        this.props.onImageBoundsChange({
            naturalWidth: this.imgRef.current.naturalWidth,
            naturalHeight: this.imgRef.current.naturalHeight,
            imageLeft: imageRect.left - containerRect.left,
            imageTop: imageRect.top - containerRect.top,
            imageWidth: imageRect.width,
            imageHeight: imageRect.height,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height
        });
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
            const aladinWidth = this.props.fitContainer ? driveMaxWidth : "550";
            const aladinHeight = this.props.fitContainer ? driveMaxHeight : "550";
            if (this.props.preview) {
                return <img src={`${import.meta.env.BASE_URL}aladin.png`} />;
            }
            return (
                <AladinLiteFrame target={aladinTargetName} width={aladinWidth} height={aladinHeight} />
            );
        } else {
            const invert = this.props.inverted ? "100" : "0";
            const rotation = this.props.rotation;
            const scale = this.props.zoomLevel / 100;
            const scaleToUse = this.props.preventUpscale ? Math.min(scale, 1) : scale;
            const backgroundColor = this.props.backgroundColor && this.props.backgroundColor >= 255 ? "white" : "black";
            const shouldUseNaturalSize = this.props.fitContainer || this.props.preventUpscale;
            const shouldFillImageBounds = this.props.fitContainer || this.props.preventUpscale;
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
                    style={{ backgroundColor: `${backgroundColor}`, width: shouldFillImageBounds ? "100%" : undefined, height: shouldFillImageBounds ? "100%" : undefined }}
                >
                    <img
                        //crossOrigin="anonymous"
                        ref={this.imgRef}
                        src={imgSrc}
                        title={this.props.name}
                        className={classes.image}
                        onLoad={this.notifyImageBoundsChange}
                        style={{ transform: `rotate(${rotation}deg) scale(${scaleToUse})`, filter: `invert(${invert}%)`, width: shouldUseNaturalSize ? "auto" : undefined, maxWidth: shouldUseNaturalSize ? "100%" : undefined, maxHeight: shouldUseNaturalSize ? "100%" : undefined }}
                    />
                </div>
            );
        }
    }
}

export default withStyles(styles)(ResourceImage);
