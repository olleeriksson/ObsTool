import * as React from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
// import Typography from "@material-ui/core/Typography";
import green from "@material-ui/core/colors/green";
import amber from "@material-ui/core/colors/amber";
import classNames from "classnames";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import IconButton from "@material-ui/core/IconButton";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import CloseIcon from "@material-ui/icons/Close";
import WarningIcon from "@material-ui/icons/Warning";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

const styles = (theme: Theme) => createStyles({
    success: {
        backgroundColor: green[600],
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    info: {
        backgroundColor: theme.palette.primary.dark,
    },
    warning: {
        backgroundColor: amber[700],
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    close: {
    },
    message: {
        display: "flex",
        alignItems: "center",
    },
});

export interface IMySnackbar extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    className?: string;
    message: React.ReactNode;
    onClose?: () => void;
    variant: "success" | "warning" | "error" | "info";
}

interface IMySnackbarState {
    open: boolean;
}

class MySnackbar extends React.Component<IMySnackbar, IMySnackbarState> {
    constructor(props: IMySnackbar) {
        super(props);

        this.state = {
            open: false,
        };
    }

    public render() {
        const { classes, className, message, onClose, variant, ...other } = this.props;
        const Icon = variantIcon[variant];

        const action = <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            className={classes.close}
            onClick={onClose}
        >
            <CloseIcon className={classes.icon} />
        </IconButton>;

        return (
            <SnackbarContent
                className={classNames(classes[variant], className)}
                aria-describedby="client-snackbar"
                message={<span id="client-snackbar" className={classes.message}><Icon className={classNames(classes.icon, classes.iconVariant)} />{message}</span>}
                action={action}
                {...other}
            />
        );
    }
}

export default withStyles(styles)(MySnackbar);
