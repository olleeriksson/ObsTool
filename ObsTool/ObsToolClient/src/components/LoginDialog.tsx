import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Api from "src/api/Api";
import { ILoginInfo } from "src/types/Types";
import { CircularProgress } from "@mui/material";

interface ILoginDialogProps {
    isOpen: boolean;
    onLogin: () => void;
    onCancel: () => void;
}

interface IFormFieldsState {
    username: string;
    password: string;
}

export default function LoginDialog(props: ILoginDialogProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [formFields, setFormFields] = React.useState<IFormFieldsState>({
        username: "",
        password: ""
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
                    label="Username"
                    value={formFields.username}
                    fullWidth={true}
                    autoComplete="username"
                    onChange={handleInputChange}
                />
                <TextField
                    name="password"
                    label="Password"
                    type="password"
                    margin="normal"
                    value={formFields.password}
                    fullWidth={true}
                    autoComplete="current-password"
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
