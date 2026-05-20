import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { connect } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { bindActionCreators, Dispatch } from "redux";
import * as authenticationAction from "../actions/AuthenticationActions";
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
    }
});

interface IResetPasswordPageProps extends WithStyles<typeof styles> {
    actions: any;
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "Password reset failed.";
}

function ResetPasswordPage(props: IResetPasswordPageProps) {
    const { classes } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const userId = Number(query.get("userId"));
    const token = query.get("token") ?? "";
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(undefined);

        Api.resetPassword({ userId, token, password, confirmPassword }).then(
            response => {
                props.actions.setLoggedIn(response.data);
                setIsLoading(false);
                navigate("/", { replace: true });
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    };

    const isInvalidLink = !userId || !token;

    return (
        <AuthenticationPageFrame title="Reset password">
            {isInvalidLink ? (
                <div className={classes.form}>
                    <Typography className={classes.error}>The reset link is invalid.</Typography>
                    <Button component={Link} to="/forgot-password" color="primary">
                        Request a new link
                    </Button>
                </div>
            ) : (
                <form className={classes.form} onSubmit={handleSubmit}>
                    <TextField
                        label="New password"
                        type="password"
                        value={password}
                        helperText="At least 10 characters, including a letter and a number."
                        fullWidth={true}
                        autoComplete="new-password"
                        autoFocus={true}
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
                    {error && <Typography className={classes.error}>{error}</Typography>}
                    <div className={classes.actions}>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                            Reset password
                        </Button>
                        {isLoading && <CircularProgress size={24} />}
                    </div>
                </form>
            )}
        </AuthenticationPageFrame>
    );
}

const mapDispatchToProps = (dispatch: Dispatch<authenticationAction.AuthenticationAction>) => {
    return {
        actions: bindActionCreators(
            { ...authenticationAction },
            dispatch
        )
    };
};

export default connect(null, mapDispatchToProps)(withStyles(styles)(ResetPasswordPage));
