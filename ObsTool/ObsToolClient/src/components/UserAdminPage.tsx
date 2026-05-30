import * as React from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import { IAppState, IDataState, IUserAdmin, IUserAdminList } from "src/types/Types";

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
    passwordDialogFields: {
        display: "grid",
        gap: theme.spacing(1),
        marginTop: theme.spacing(2)
    },
    userDialogFields: {
        display: "grid",
        gap: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    userIdentity: {
        fontWeight: theme.typography.fontWeightMedium
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

interface IUserFormFields {
    email: string;
    username: string;
    fullName: string;
    emailConfirmed: boolean;
    password: string;
    confirmPassword: string;
}

type UserDialogMode = "create" | "edit";

const emptyUserFormFields: IUserFormFields = {
    email: "",
    username: "",
    fullName: "",
    emailConfirmed: true,
    password: "",
    confirmPassword: ""
};

function getErrorMessage(error: any) {
    return error?.response?.data?.Message
        ?? error?.response?.data?.message
        ?? error?.message
        ?? "User Management request failed.";
}

// Formats admin timestamps with a stable sortable date and 24-hour time.
function formatDate(value?: string) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    const pad = (part: number) => part.toString().padStart(2, "0");

    return [
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    ].join(" ");
}

// Builds the primary user label shown in the password dialog and success message.
function getUserDisplayName(user: IUserAdmin) {
    return user.fullName || user.email || user.username || `User ${user.id}`;
}

// Builds the secondary identity line so admins can verify exactly which account is being changed.
function getUserIdentityLine(user: IUserAdmin) {
    const parts = [user.email, user.username ? `@${user.username}` : undefined].filter(Boolean);
    return parts.join(" - ");
}

function UserAdminPage(props: IUserAdminPageProps) {
    const { classes } = props;
    const [adminList, setAdminList] = React.useState<IUserAdminList | undefined>();
    const [userDialogMode, setUserDialogMode] = React.useState<UserDialogMode | undefined>();
    const [userDialogUser, setUserDialogUser] = React.useState<IUserAdmin | undefined>();
    const [userFields, setUserFields] = React.useState<IUserFormFields>(emptyUserFormFields);
    const [passwordDialogUser, setPasswordDialogUser] = React.useState<IUserAdmin | undefined>();
    const [passwordFields, setPasswordFields] = React.useState<IPasswordFields>({ password: "", confirmPassword: "" });
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSavingUser, setIsSavingUser] = React.useState(false);
    const [busyUserId, setBusyUserId] = React.useState<number | undefined>();
    const [error, setError] = React.useState<string | undefined>();
    const [message, setMessage] = React.useState<string | undefined>();

    const loadUsers = React.useCallback(() => {
        if (!props.store.canManageUsers) {
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
    }, [props.store.canManageUsers]);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Opens the user dialog with blank fields for an admin-created database account.
    const openCreateUserDialog = () => {
        setUserDialogMode("create");
        setUserDialogUser(undefined);
        setUserFields({ ...emptyUserFormFields });
        setError(undefined);
        setMessage(undefined);
    };

    // Opens the user dialog with the selected account details for profile editing.
    const openEditUserDialog = (user: IUserAdmin) => {
        setUserDialogMode("edit");
        setUserDialogUser(user);
        setUserFields({
            email: user.email || "",
            username: user.username || "",
            fullName: user.fullName || "",
            emailConfirmed: user.emailConfirmed,
            password: "",
            confirmPassword: ""
        });
        setError(undefined);
        setMessage(undefined);
    };

    // Keeps the create/edit dialog state normalized before it is sent to the API.
    const updateUserField = (fieldName: keyof IUserFormFields, value: string | boolean) => {
        setUserFields({
            ...userFields,
            [fieldName]: value
        });
    };

    // Closes the create/edit dialog unless a save request is currently in flight.
    const closeUserDialog = () => {
        if (isSavingUser) {
            return;
        }

        setUserDialogMode(undefined);
        setUserDialogUser(undefined);
        setUserFields({ ...emptyUserFormFields });
    };

    // Saves either a new user or profile edits for the selected database user.
    const handleSaveUser = () => {
        const request = {
            email: userFields.email,
            username: userFields.username || undefined,
            fullName: userFields.fullName,
            emailConfirmed: userFields.emailConfirmed
        };
        const saveRequest = userDialogMode === "create"
            ? Api.adminCreateUser({
                ...request,
                password: userFields.password,
                confirmPassword: userFields.confirmPassword
            })
            : userDialogUser
                ? Api.adminUpdateUser(userDialogUser.id, request)
                : undefined;

        if (!saveRequest) {
            return;
        }

        setIsSavingUser(true);
        setError(undefined);
        setMessage(undefined);

        saveRequest.then(
            response => {
                setIsSavingUser(false);
                setUserDialogMode(undefined);
                setUserDialogUser(undefined);
                setUserFields({ ...emptyUserFormFields });
                setMessage(userDialogMode === "create"
                    ? `User created for ${response.data.email}.`
                    : `User updated for ${response.data.email}.`);
                loadUsers();
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setIsSavingUser(false);
            }
        );
    };

    // Opens a focused password dialog for the selected database user.
    const openPasswordDialog = (user: IUserAdmin) => {
        setPasswordDialogUser(user);
        setPasswordFields({ password: "", confirmPassword: "" });
        setError(undefined);
        setMessage(undefined);
    };

    // Keeps the dialog fields together because only one user can be edited at a time.
    const updatePasswordField = (fieldName: keyof IPasswordFields, value: string) => {
        setPasswordFields({
            ...passwordFields,
            [fieldName]: value
        });
    };

    // Sends the password change for the user currently shown in the dialog.
    const handleChangePassword = () => {
        if (!passwordDialogUser) {
            return;
        }

        const userId = passwordDialogUser.id;
        setBusyUserId(userId);
        setError(undefined);
        setMessage(undefined);

        Api.adminChangeUserPassword(userId, passwordFields).then(
            () => {
                setPasswordFields({ password: "", confirmPassword: "" });
                setPasswordDialogUser(undefined);
                setBusyUserId(undefined);
                setMessage(`Password changed for ${getUserDisplayName(passwordDialogUser)}.`);
            },
            errorResponse => {
                setError(getErrorMessage(errorResponse));
                setBusyUserId(undefined);
            }
        );
    };

    // Closes the dialog without changing the selected user's password.
    const closePasswordDialog = () => {
        if (busyUserId !== undefined) {
            return;
        }

        setPasswordDialogUser(undefined);
        setPasswordFields({ password: "", confirmPassword: "" });
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

    if (!props.store.canManageUsers) {
        return (
            <div className={classes.root}>
                <Paper className={classes.panel}>
                    <Typography variant="h5">User Management</Typography>
                    <Typography className={classes.muted}>Only users with user-management access can use this page.</Typography>
                </Paper>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <Paper className={classes.panel}>
                <div className={classes.actions}>
                    <Typography variant="h5">User Management</Typography>
                    {isLoading && <CircularProgress size={20} />}
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={isSavingUser || busyUserId !== undefined}
                        onClick={openCreateUserDialog}
                    >
                        New user
                    </Button>
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
                                <TableCell>Edit</TableCell>
                                <TableCell>Change password</TableCell>
                                <TableCell>Delete</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(adminList?.users ?? []).map(user => {
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
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                disabled={isBusy || isSavingUser}
                                                onClick={() => openEditUserDialog(user)}
                                            >
                                                Edit
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="small"
                                                disabled={isBusy || isSavingUser}
                                                onClick={() => openPasswordDialog(user)}
                                            >
                                                Change password
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                color="secondary"
                                                disabled={isBusy || isSavingUser}
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
                                    <TableCell colSpan={9}>No database users.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog
                    open={Boolean(userDialogMode)}
                    onClose={closeUserDialog}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>{userDialogMode === "create" ? "New user" : "Edit user"}</DialogTitle>
                    <DialogContent>
                        <div className={classes.userDialogFields}>
                            <TextField
                                autoFocus
                                fullWidth
                                label="Email"
                                type="email"
                                value={userFields.email}
                                onChange={event => updateUserField("email", event.currentTarget.value)}
                            />
                            <TextField
                                fullWidth
                                label="Username"
                                value={userFields.username}
                                onChange={event => updateUserField("username", event.currentTarget.value)}
                            />
                            <TextField
                                fullWidth
                                label="Full name"
                                value={userFields.fullName}
                                onChange={event => updateUserField("fullName", event.currentTarget.value)}
                            />
                            <FormControlLabel
                                control={(
                                    <Checkbox
                                        checked={userFields.emailConfirmed}
                                        onChange={event => updateUserField("emailConfirmed", event.currentTarget.checked)}
                                    />
                                )}
                                label="Email confirmed"
                            />
                            {userDialogMode === "create" && (
                                <>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type="password"
                                        value={userFields.password}
                                        onChange={event => updateUserField("password", event.currentTarget.value)}
                                        autoComplete="new-password"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm password"
                                        type="password"
                                        value={userFields.confirmPassword}
                                        onChange={event => updateUserField("confirmPassword", event.currentTarget.value)}
                                        autoComplete="new-password"
                                    />
                                </>
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button disabled={isSavingUser} onClick={closeUserDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={isSavingUser}
                            onClick={handleSaveUser}
                        >
                            {userDialogMode === "create" ? "Create user" : "Save changes"}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={Boolean(passwordDialogUser)}
                    onClose={closePasswordDialog}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>Change password</DialogTitle>
                    <DialogContent>
                        {passwordDialogUser && (
                            <DialogContentText component="div">
                                <div>Changing password for:</div>
                                <div className={classes.userIdentity}>{getUserDisplayName(passwordDialogUser)}</div>
                                <div>{getUserIdentityLine(passwordDialogUser)}</div>
                            </DialogContentText>
                        )}
                        <div className={classes.passwordDialogFields}>
                            <TextField
                                autoFocus
                                fullWidth
                                label="New password"
                                type="password"
                                value={passwordFields.password}
                                onChange={event => updatePasswordField("password", event.currentTarget.value)}
                                autoComplete="new-password"
                            />
                            <TextField
                                fullWidth
                                label="Confirm password"
                                type="password"
                                value={passwordFields.confirmPassword}
                                onChange={event => updatePasswordField("confirmPassword", event.currentTarget.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button disabled={busyUserId !== undefined} onClick={closePasswordDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={busyUserId !== undefined}
                            onClick={handleChangePassword}
                        >
                            Change password
                        </Button>
                    </DialogActions>
                </Dialog>

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
