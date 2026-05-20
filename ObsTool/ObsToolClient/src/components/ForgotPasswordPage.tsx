import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import Api from "src/api/Api";
import AuthenticationPageFrame from "./AuthenticationPageFrame";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";

const styles = (theme: Theme) => createStyles({
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

interface IForgotPasswordPageProps extends WithStyles<typeof styles> {
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "Password reset request failed.";
}

function ForgotPasswordPage(props: IForgotPasswordPageProps) {
    const { classes } = props;
    const [email, setEmail] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();
    const [isComplete, setIsComplete] = React.useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(undefined);
        setIsComplete(false);

        Api.forgotPassword({ email }).then(
            () => {
                setIsLoading(false);
                setIsComplete(true);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    };

    return (
        <AuthenticationPageFrame title="Forgot password">
            <form className={classes.form} onSubmit={handleSubmit}>
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    fullWidth={true}
                    autoComplete="email"
                    autoFocus={true}
                    onChange={event => setEmail(event.currentTarget.value)}
                    required={true}
                />
                {isComplete && <Typography className={classes.success}>If that address belongs to a confirmed user, a reset email has been sent.</Typography>}
                {error && <Typography className={classes.error}>{error}</Typography>}
                <div className={classes.actions}>
                    <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                        Send reset email
                    </Button>
                    <Button component={Link} to="/login" color="primary">
                        Back to login
                    </Button>
                    {isLoading && <CircularProgress size={24} />}
                </div>
            </form>
        </AuthenticationPageFrame>
    );
}

export default withStyles(styles)(ForgotPasswordPage);
