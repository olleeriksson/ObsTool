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
import { ISignupRequest } from "src/types/Types";

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
        color: theme.palette.success.main,
        marginTop: theme.spacing(2)
    }
});

interface ISignupPageProps extends WithStyles<typeof styles> {
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "Sign up failed.";
}

function SignupPage(props: ISignupPageProps) {
    const { classes } = props;
    const [formFields, setFormFields] = React.useState<ISignupRequest>({
        email: "",
        username: "",
        fullName: "",
        password: ""
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();
    const [isComplete, setIsComplete] = React.useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormFields({
            ...formFields,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(undefined);
        setIsComplete(false);

        Api.signup(formFields).then(
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
        <AuthenticationPageFrame title="Sign up">
            {isComplete ? (
                <>
                    <Typography className={classes.success}>Check your email to confirm your address before logging in.</Typography>
                    <div className={classes.actions}>
                        <Button component={Link} to="/login" color="primary">
                            Back to login
                        </Button>
                    </div>
                </>
            ) : (
                <form className={classes.form} onSubmit={handleSubmit}>
                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formFields.email}
                        fullWidth={true}
                        autoComplete="email"
                        autoFocus={true}
                        onChange={handleInputChange}
                        required={true}
                    />
                    <TextField
                        name="username"
                        label="Username"
                        value={formFields.username}
                        fullWidth={true}
                        autoComplete="username"
                        onChange={handleInputChange}
                    />
                    <TextField
                        name="fullName"
                        label="Full name"
                        value={formFields.fullName}
                        fullWidth={true}
                        autoComplete="name"
                        onChange={handleInputChange}
                        required={true}
                    />
                    <TextField
                        name="password"
                        label="Password"
                        type="password"
                        value={formFields.password}
                        helperText="At least 10 characters, including a letter and a number."
                        fullWidth={true}
                        autoComplete="new-password"
                        onChange={handleInputChange}
                        required={true}
                    />
                    {error && <Typography className={classes.error}>{error}</Typography>}
                    <div className={classes.actions}>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                            Sign up
                        </Button>
                        <Button component={Link} to="/login" color="primary">
                            Back to login
                        </Button>
                        {isLoading && <CircularProgress size={24} />}
                    </div>
                </form>
            )}
        </AuthenticationPageFrame>
    );
}

export default withStyles(styles)(SignupPage);
