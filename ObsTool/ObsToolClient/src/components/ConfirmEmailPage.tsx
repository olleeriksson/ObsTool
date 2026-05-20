import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import Api from "src/api/Api";
import AuthenticationPageFrame from "./AuthenticationPageFrame";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";

const styles = (theme: Theme) => createStyles({
    content: {
        display: "grid",
        gap: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    error: {
        color: theme.palette.error.main
    },
    success: {
        color: theme.palette.success.main
    }
});

interface IConfirmEmailPageProps extends WithStyles<typeof styles> {
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "Email confirmation failed.";
}

function ConfirmEmailPage(props: IConfirmEmailPageProps) {
    const { classes } = props;
    const location = useLocation();
    const [email, setEmail] = React.useState<string | undefined>();
    const [error, setError] = React.useState<string | undefined>();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const query = new URLSearchParams(location.search);
        const userId = Number(query.get("userId"));
        const token = query.get("token") ?? "";

        if (!userId || !token) {
            setError("The confirmation link is invalid.");
            setIsLoading(false);
            return;
        }

        Api.confirmEmail({ userId, token }).then(
            response => {
                setEmail(response.data.email);
                setIsLoading(false);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    }, [location.search]);

    const loginUrl = email ? `/login?email=${encodeURIComponent(email)}` : "/login";

    return (
        <AuthenticationPageFrame title="Email confirmation">
            <div className={classes.content}>
                {isLoading && <CircularProgress size={24} />}
                {email && <Typography className={classes.success}>Your email address is confirmed.</Typography>}
                {error && <Typography className={classes.error}>{error}</Typography>}
                {!isLoading && (
                    <Button component={Link} to={loginUrl} color="primary" variant="contained">
                        Go to login
                    </Button>
                )}
            </div>
        </AuthenticationPageFrame>
    );
}

export default withStyles(styles)(ConfirmEmailPage);
