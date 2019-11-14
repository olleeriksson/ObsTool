import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Api from "src/api/Api";
import { ILoginInfo } from "src/types/Types";
import { CircularProgress } from "@material-ui/core";

interface ILoginDialogProps {
    isOpen: boolean;
    onLogin: () => void;
    onCancel: () => void;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            display: "flex",
            flexWrap: "wrap",
        },
        textField: {
        },
    }),
);

interface IFormFieldsState {
    username: string;
    password: string;
}

export default function LoginDialog(props: ILoginDialogProps) {
    const classes = useStyles();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [formFields, setFormFields] = React.useState<IFormFieldsState>({
        username: "test",
        password: "test"
    });

    const handleInputChange = (e: any) => setFormFields({
        ...formFields,
        [e.currentTarget.name]: e.currentTarget.value
    });

    const handleOnClickLogin = () => {
        const loginInfo: ILoginInfo = {
            username: formFields.username,
            password: formFields.password
        };
        Api.login(loginInfo).then(
            () => {
                setIsLoading(false);
                props.onLogin();
            },
            () => {
                alert("Login failed!");
                setIsLoading(false);
                props.onCancel();
            }
        );
    };

    const handleOnClickClose = () => {
        setIsLoading(false);
        props.onCancel();
    };

    let circularProgress;
    if (isLoading) {
        circularProgress = (
            <CircularProgress />
        );
    }

    return (
        <Dialog open={props.isOpen} onClose={handleOnClickClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Login</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Logging is required to be able to edit observing reports.
                </DialogContentText>
                <TextField
                    name="username"
                    autoFocus={true}
                    margin="normal"
                    className={classes.textField}
                    label="Username"
                    fullWidth={true}
                    onChange={handleInputChange}
                />
                <TextField
                    name="password"
                    label="Password"
                    className={classes.textField}
                    margin="normal"
                    fullWidth={true}
                    onChange={handleInputChange}
                />
            </DialogContent>
            <DialogActions>
                {circularProgress}
                <Button onClick={handleOnClickLogin} color="primary" disabled={isLoading}>
                    Login
                </Button>
                <Button onClick={handleOnClickClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
