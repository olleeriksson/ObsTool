import * as React from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
// import Typography from "@mui/material/Typography";
import green from "@mui/material/colors/green";
import amber from "@mui/material/colors/amber";
import classNames from "classnames";
import SnackbarContent from "@mui/material/SnackbarContent";
import IconButton from "@mui/material/IconButton";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
        marginRight: theme.spacing(1),
    },
    close: {
    },
    message: {
        display: "flex",
        alignItems: "center",
    },
});

export interface IMySnackbarProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    className?: string;
    message: React.ReactNode;
    onClose?: () => void;
    variant: "success" | "warning" | "error" | "info";
}

interface IMySnackbarState {
    open: boolean;
}

class MySnackbar extends React.Component<IMySnackbarProps, IMySnackbarState> {
    constructor(props: IMySnackbarProps) {
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
