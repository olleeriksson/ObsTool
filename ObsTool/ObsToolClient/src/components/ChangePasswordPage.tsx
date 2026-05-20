import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import Api from "src/api/Api";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(4),
        maxWidth: 560
    },
    panel: {
        padding: theme.spacing(3)
    },
    form: {
        display: "grid",
        gap: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    actions: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(2)
    },
    error: {
        color: theme.palette.error.main
    },
    success: {
        color: theme.palette.success.main
    }
});

interface IChangePasswordPageProps extends WithStyles<typeof styles> {
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "Password change failed.";
}

function ChangePasswordPage(props: IChangePasswordPageProps) {
    const { classes } = props;
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();
    const [isComplete, setIsComplete] = React.useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(undefined);
        setIsComplete(false);

        Api.changePassword({ currentPassword, password, confirmPassword }).then(
            () => {
                setIsLoading(false);
                setCurrentPassword("");
                setPassword("");
                setConfirmPassword("");
                setIsComplete(true);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    };

    return (
        <div className={classes.root}>
            <Paper className={classes.panel}>
                <Typography variant="h5">Change password</Typography>
                <form className={classes.form} onSubmit={handleSubmit}>
                    <TextField
                        label="Current password"
                        type="password"
                        value={currentPassword}
                        fullWidth={true}
                        autoComplete="current-password"
                        onChange={event => setCurrentPassword(event.currentTarget.value)}
                        required={true}
                    />
                    <TextField
                        label="New password"
                        type="password"
                        value={password}
                        helperText="At least 10 characters, including a letter and a number."
                        fullWidth={true}
                        autoComplete="new-password"
                        onChange={event => setPassword(event.currentTarget.value)}
                        required={true}
                    />
                    <TextField
                        label="Confirm new password"
                        type="password"
                        value={confirmPassword}
                        fullWidth={true}
                        autoComplete="new-password"
                        onChange={event => setConfirmPassword(event.currentTarget.value)}
                        required={true}
                    />
                    {isComplete && <Typography className={classes.success}>Password changed.</Typography>}
                    {error && <Typography className={classes.error}>{error}</Typography>}
                    <div className={classes.actions}>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                            Change password
                        </Button>
                        {isLoading && <CircularProgress size={24} />}
                    </div>
                </form>
            </Paper>
        </div>
    );
}

export default withStyles(styles)(ChangePasswordPage);
