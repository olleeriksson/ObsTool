import * as React from "react";
import { WithStyles, withStyles } from "@material-ui/styles";
import { createStyles } from "@material-ui/core/styles";

const styles = () => createStyles({
    frame: {
        width: 550,
        height: 550
    },
});

interface IAladinLiteFrameProps extends WithStyles<typeof styles> {
    target?: string;
    width: string;
    height: string;
}

interface IAladinLiteFrameState {
    isLoading: boolean;
}

class AladinLiteFrame extends React.Component<IAladinLiteFrameProps, IAladinLiteFrameState> {
    constructor(props: IAladinLiteFrameProps) {
        super(props);

        this.state = {
            isLoading: false
        };
    }

    private finishedLoadingScripts = () => {
        this.setState({ isLoading: false });
        this.loadAladinLite();
    }

    private loadAladinLite = () => {
        if (this.props.target) {
            (window as any).A.aladin("#aladin-lite-div", { survey: "P/DSS2/color", fov: 1, target: this.props.target });
        }
    }

    private loadScriptSynchronously(url: string, onload?: () => void) {
        if (!document.getElementById(url)) {  // prevents it from loading twice
            const script = document.createElement("script");
            script.id = url;
            script.src = url;
            script.async = false;
            script.onload = onload || null;
            document.body.appendChild(script);
        } else {
            if (onload) {
                onload();
            }
        }
    }

    // Couldn't get this to work, so you have to add the following line to the line before the <title> in the <head> in index.html
    //   <link rel="stylesheet" href="https://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.css" />
    //private loadCss(url: string) {
    //    const link = document.createElement("link");
    //    link.rel = "stylesheet";
    //    link.type = "text/css";
    //    link.href = url;
    //    document.head.appendChild(link);
    //}

    public componentDidMount() {
        // Couldn't get this to work:
        //this.loadCss("https://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.css");
        this.loadScriptSynchronously("https://code.jquery.com/jquery-1.12.1.min.js");
        this.loadScriptSynchronously("https://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.js", this.finishedLoadingScripts);
    }

    public componentDidUpdate() {
        this.loadAladinLite();
    }

    public render() {
        const { classes } = this.props;
        // className={classes.frame}
        return (
            <>
                <div id="aladin-lite-div" className={classes.frame} />
            </>
        );
    }
}

export default withStyles(styles)(AladinLiteFrame);
