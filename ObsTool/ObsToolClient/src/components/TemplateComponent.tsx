import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";

const styles = (theme: Theme) => createStyles({
    root: {
    },
});

interface ITemplateComponentProps extends WithStyles<typeof styles> {
    dummyProp: boolean;
}

interface ITemplateComponentState {
    isLoading: boolean;
}

class TemplateComponent extends React.Component<ITemplateComponentProps, ITemplateComponentState> {
    constructor(props: ITemplateComponentProps) {
        super(props);

        this.state = {
            isLoading: false,
        };
    }

    // private handleChange = (name: string) => (event: any) => {
    //     this.setState((prevState, props) => ({
    //         ...prevState,
    //         [name]: event.target.value
    //     }));
    // }

    public render() {
        const { classes } = this.props;

        return <div className={classes.root}>
            {this.state.isLoading ? "Is loading.." : "Not loading"}
        </div>;
    }
}

export default withStyles(styles)(TemplateComponent);
