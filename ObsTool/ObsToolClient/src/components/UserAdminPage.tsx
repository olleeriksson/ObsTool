import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { connect } from "react-redux";
import Api from "src/api/Api";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IAppState, IDataState, IUserAdminList } from "src/types/Types";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(4)
    },
    panel: {
        padding: theme.spacing(3)
    },
    section: {
        marginTop: theme.spacing(3)
    },
    actions: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(1)
    },
    passwordFields: {
        display: "grid",
        gap: theme.spacing(1),
        minWidth: 230
    },
    error: {
        color: theme.palette.error.main,
        marginTop: theme.spacing(2)
    },
    success: {
        color: theme.palette.success.main,
        marginTop: theme.spacing(2)
    },
    muted: {
        color: theme.palette.text.secondary
    }
});

interface IUserAdminPageProps extends WithStyles<typeof styles> {
    store: IDataState;
}

interface IPasswordFields {
    password: string;
    confirmPassword: string;
}

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "User admin request failed.";
}

function formatDate(value?: string) {
    return value ? new Date(value).toLocaleString() : "";
}

function UserAdminPage(props: IUserAdminPageProps) {
    const { classes } = props;
    const [adminList, setAdminList] = React.useState<IUserAdminList | undefined>();
    const [passwordFields, setPasswordFields] = React.useState<Record<number, IPasswordFields>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [busyUserId, setBusyUserId] = React.useState<number | undefined>();
    const [error, setError] = React.useState<string | undefined>();
    const [message, setMessage] = React.useState<string | undefined>();

    const loadUsers = React.useCallback(() => {
        if (!props.store.isSuperAdmin) {
            return;
        }

        setIsLoading(true);
        setError(undefined);

        Api.getUserAdminList().then(
            response => {
                setAdminList(response.data);
                setIsLoading(false);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsLoading(false);
            }
        );
    }, [props.store.isSuperAdmin]);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const updatePasswordField = (userId: number, fieldName: keyof IPasswordFields, value: string) => {
        const currentFields = passwordFields[userId] ?? { password: "", confirmPassword: "" };
        setPasswordFields({
            ...passwordFields,
            [userId]: {
                ...currentFields,
                [fieldName]: value
            }
        });
    };

    const handleChangePassword = (userId: number) => {
        const fields = passwordFields[userId] ?? { password: "", confirmPassword: "" };
        setBusyUserId(userId);
        setError(undefined);
        setMessage(undefined);

        Api.adminChangeUserPassword(userId, fields).then(
            () => {
                setPasswordFields({
                    ...passwordFields,
                    [userId]: { password: "", confirmPassword: "" }
                });
                setBusyUserId(undefined);
                setMessage("Password changed.");
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setBusyUserId(undefined);
            }
        );
    };

    const handleDeleteUser = (userId: number) => {
        if (!window.confirm("Delete this database user?")) {
            return;
        }

        setBusyUserId(userId);
        setError(undefined);
        setMessage(undefined);

        Api.adminDeleteUser(userId).then(
            () => {
                setBusyUserId(undefined);
                setMessage("User deleted.");
                loadUsers();
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setBusyUserId(undefined);
            }
        );
    };

    if (!props.store.isSuperAdmin) {
        return (
            <div className={classes.root}>
                <Paper className={classes.panel}>
                    <Typography variant="h5">User admin</Typography>
                    <Typography className={classes.muted}>Only configured superadmin users can use this page.</Typography>
                </Paper>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <Paper className={classes.panel}>
                <div className={classes.actions}>
                    <Typography variant="h5">User admin</Typography>
                    {isLoading && <CircularProgress size={20} />}
                </div>

                <div className={classes.section}>
                    <Typography variant="h6">Database users</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Full name</TableCell>
                                <TableCell>Confirmed</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Last login</TableCell>
                                <TableCell>Change password</TableCell>
                                <TableCell>Delete</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(adminList?.users ?? []).map(user => {
                                const fields = passwordFields[user.id] ?? { password: "", confirmPassword: "" };
                                const isBusy = busyUserId === user.id;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.fullName}</TableCell>
                                        <TableCell>{user.emailConfirmed ? "Yes" : "No"}</TableCell>
                                        <TableCell>{formatDate(user.createdUtc)}</TableCell>
                                        <TableCell>{formatDate(user.lastLoginUtc)}</TableCell>
                                        <TableCell>
                                            <div className={classes.passwordFields}>
                                                <TextField
                                                    size="small"
                                                    label="New password"
                                                    type="password"
                                                    value={fields.password}
                                                    onChange={event => updatePasswordField(user.id, "password", event.currentTarget.value)}
                                                />
                                                <TextField
                                                    size="small"
                                                    label="Confirm password"
                                                    type="password"
                                                    value={fields.confirmPassword}
                                                    onChange={event => updatePasswordField(user.id, "confirmPassword", event.currentTarget.value)}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    disabled={isBusy}
                                                    onClick={() => handleChangePassword(user.id)}
                                                >
                                                    Change
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                color="secondary"
                                                disabled={isBusy}
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {adminList && adminList.users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8}>No database users.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className={classes.section}>
                    <Typography variant="h6">Configured superadmins</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Full name</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(adminList?.superAdmins ?? []).map(superAdmin => (
                                <TableRow key={superAdmin.username}>
                                    <TableCell>{superAdmin.username}</TableCell>
                                    <TableCell>{superAdmin.email}</TableCell>
                                    <TableCell>{superAdmin.fullName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {message && <Typography className={classes.success}>{message}</Typography>}
                {error && <Typography className={classes.error}>{error}</Typography>}
            </Paper>
        </div>
    );
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

export default connect(mapStateToProps)(withStyles(styles)(UserAdminPage));
