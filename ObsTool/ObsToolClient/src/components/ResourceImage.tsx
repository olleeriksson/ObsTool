import * as React from "react";
//import GoogleDriveImage from "./GoogleDriveImage";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

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

interface IResourceImageState {
    hasImageLoadError: boolean;
}

const styles = (theme: Theme) => createStyles({
    imageContainer: {
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
        position: "relative"
    },
    image: {
        width: "100%",
        // height: "auto"
    },
    brokenImageFallback: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        height: "100%",
        padding: 10,
        boxSizing: "border-box",
        textAlign: "center",
    },
    brokenImageFallbackLight: {
        backgroundColor: "#ffffff",
        color: "#dbdbdb",
    },
    brokenImageFallbackDark: {
        backgroundColor: "#000000",
        color: "#3d3d3d",
    },
    brokenImageIcon: {
        fontSize: 52,
        fontWeight: 900,
    },
    brokenImageText: {
        fontSize: "0.82rem",
        lineHeight: 1.1,
        fontWeight: 700,
    },
});

class ResourceImage extends React.PureComponent<IResourceImageProps, IResourceImageState> {
    private imgRef: React.RefObject<HTMLImageElement>;
    private imgContainerRef: React.RefObject<HTMLDivElement>;
    private resizeObserver?: ResizeObserver;

    constructor(props: IResourceImageProps) {
        super(props);
        this.imgRef = React.createRef();
        this.imgContainerRef = React.createRef();
        this.state = {
            hasImageLoadError: false
        };
    }

    public componentDidMount() {
        this.observeImageContainer();
        this.notifyImageBoundsChange();
        // const rgb = this.getAverageRGB(this.imgRef.current);
        // if (this.imgContainerRef && this.imgContainerRef.current) {
        //     this.imgContainerRef.current.style.backgroundColor = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        // }
    }

    // Clears stale error state when a different image source is rendered, then reports updated bounds.
    public componentDidUpdate(prevProps: IResourceImageProps) {
        if (this.state.hasImageLoadError && this.computeImageSrc(prevProps) !== this.computeImageSrc(this.props)) {
            this.setState({ hasImageLoadError: false });
            return;
        }

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

    // Normalizes image source generation so render and update checks stay consistent.
    private computeImageSrc = (props: IResourceImageProps): string | undefined => {
        if (props.type === "sketch" || props.type === "jot") {
            const imageId = props.url;  // the google image id is stored in the url field
            const driveMaxWidth = props.driveMaxWidth || "100";
            const driveMaxHeight = props.driveMaxHeight || "100";
            return "https://drive.google.com/thumbnail?id=" + imageId + "&sz=w" + driveMaxWidth + "-h" + driveMaxHeight;
        }
        if (props.type === "image") {
            return props.url;
        }
        return undefined;
    }

    // Marks the current image URL as failed so the tile can show a broken-image indicator.
    private handleImageLoadError = () => {
        this.setState({ hasImageLoadError: true });
    }

    // Clears temporary error state when an image URL loads successfully.
    private handleImageLoaded = () => {
        if (this.state.hasImageLoadError) {
            this.setState({ hasImageLoadError: false });
        }
        this.notifyImageBoundsChange();
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
        } else {
            const invert = this.props.inverted ? "100" : "0";
            const rotation = this.props.rotation;
            const scale = this.props.zoomLevel / 100;
            const scaleToUse = this.props.preventUpscale ? Math.min(scale, 1) : scale;
            const backgroundColor = this.props.backgroundColor && this.props.backgroundColor >= 255 ? "white" : "black";
            const shouldUseNaturalSize = this.props.preventUpscale;
            // A failed image has no intrinsic width to size this flex item, so its container must claim the available image area.
            const shouldFillImageBounds = this.props.fitContainer || this.props.preventUpscale || this.state.hasImageLoadError;
            const imgSrc = this.computeImageSrc(this.props);
            const brokenImageFallbackThemeClass = backgroundColor === "white" ? classes.brokenImageFallbackLight : classes.brokenImageFallbackDark;
            // Expanded resources use the full viewport as an object-fit frame so smaller images can enlarge without distortion.
            const imageFitStyle: React.CSSProperties = this.props.fitContainer
                ? { width: "100%", height: "100%", objectFit: "contain" }
                : { width: shouldUseNaturalSize ? "auto" : undefined, maxWidth: shouldUseNaturalSize ? "100%" : undefined, maxHeight: shouldUseNaturalSize ? "100%" : undefined };

            return (
                <div
                    ref={this.imgContainerRef}
                    className={classes.imageContainer}
                    style={{ backgroundColor: `${backgroundColor}`, width: shouldFillImageBounds ? "100%" : undefined, height: shouldFillImageBounds ? "100%" : undefined }}
                >
                    {this.state.hasImageLoadError ? (
                        <div className={`${classes.brokenImageFallback} ${brokenImageFallbackThemeClass}`} title="Image URL could not be loaded">
                            <FontAwesomeIcon icon={faQuestionCircle} className={classes.brokenImageIcon} />
                            <span className={classes.brokenImageText}>Image unavailable</span>
                        </div>
                    ) : (
                        <img
                            //crossOrigin="anonymous"
                            ref={this.imgRef}
                            src={imgSrc}
                            title={this.props.name}
                            className={classes.image}
                            onLoad={this.handleImageLoaded}
                            onError={this.handleImageLoadError}
                            style={{ transform: `rotate(${rotation}deg) scale(${scaleToUse})`, filter: `invert(${invert}%)`, ...imageFitStyle }}
                        />
                    )}
                </div>
            );
        }
    }
}

export default withStyles(styles)(ResourceImage);
