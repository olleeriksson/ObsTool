import * as React from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { connect } from "react-redux";
import Api from "src/api/Api";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IAppState, IDataState, IEmailTestResult, IEmailTestSettings } from "src/types/Types";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(4),
        maxWidth: 760
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
    statusBlock: {
        background: theme.palette.grey[100],
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        whiteSpace: "pre-wrap"
    },
    error: {
        color: theme.palette.error.main
    },
    muted: {
        color: theme.palette.text.secondary
    }
});

interface IEmailDiagnosticsViewProps extends WithStyles<typeof styles> {
    store: IDataState;
}

interface IEmailDiagnosticsViewState {
    to: string;
    subject: string;
    body: string;
    settings?: IEmailTestSettings;
    result?: IEmailTestResult;
    error?: string;
    isLoadingSettings: boolean;
    isSending: boolean;
}

class EmailDiagnosticsView extends React.Component<IEmailDiagnosticsViewProps, IEmailDiagnosticsViewState> {
    public state: IEmailDiagnosticsViewState = {
        to: "",
        subject: "ObsTool test email",
        body: "This is a test email from the deployed ObsTool backend.",
        isLoadingSettings: false,
        isSending: false
    };

    public componentDidMount() {
        if (this.props.store.isLoggedIn) {
            this.loadSettings();
        }
    }

    public componentDidUpdate(previousProps: IEmailDiagnosticsViewProps) {
        if (!previousProps.store.isLoggedIn && this.props.store.isLoggedIn) {
            this.loadSettings();
        }
    }

    private loadSettings = () => {
        this.setState({ isLoadingSettings: true, error: undefined });

        Api.getEmailTestSettings().then(
            response => {
                this.setState({
                    settings: response.data,
                    isLoadingSettings: false
                });
            },
            error => {
                this.setState({
                    error: this.getErrorMessage(error),
                    isLoadingSettings: false
                });
            }
        );
    };

    private handleSend = () => {
        this.setState({ isSending: true, result: undefined, error: undefined });

        Api.sendEmailTest({
            to: this.state.to,
            subject: this.state.subject,
            body: this.state.body
        }).then(
            response => {
                this.setState({
                    result: response.data,
                    isSending: false
                });
                this.loadSettings();
            },
            error => {
                this.setState({
                    error: this.getErrorMessage(error),
                    isSending: false
                });
            }
        );
    };

    private getErrorMessage(error: any) {
        return error?.response?.data?.Message
            ?? error?.response?.data?.message
            ?? error?.message
            ?? "The email test failed.";
    }

    public render() {
        const { classes } = this.props;

        if (!this.props.store.isLoggedIn) {
            return (
                <div className={classes.root}>
                    <Paper className={classes.panel}>
                        <Typography variant="h5">Email diagnostics</Typography>
                        <Typography className={classes.muted}>Log in before using this page.</Typography>
                    </Paper>
                </div>
            );
        }

        const settings = this.state.settings;
        const settingsText = settings
            ? [
                `Configured: ${settings.isConfigured ? "yes" : "no"}`,
                `From: ${settings.mailFrom || "(not set)"}`,
                `Default recipient: ${settings.mailTo || "(not set)"}`,
                `SMTP: ${settings.smtpHost || "(not set)"}:${settings.smtpPort}`,
                `Security: ${settings.secureSocketOption || "(not set)"}`,
                `Username configured: ${settings.hasUsername ? "yes" : "no"}`,
                `Password configured: ${settings.hasPassword ? "yes" : "no"}`
            ].join("\n")
            : "Loading settings...";

        const resultText = this.state.result
            ? [
                this.state.result.message,
                `To: ${this.state.result.to}`,
                `From: ${this.state.result.from}`,
                `SMTP: ${this.state.result.smtpHost}:${this.state.result.smtpPort}`,
                `UTC: ${this.state.result.sentAtUtc}`
            ].join("\n")
            : undefined;

        return (
            <div className={classes.root}>
                <Paper className={classes.panel}>
                    <Typography variant="h5">Email diagnostics</Typography>
                    <Typography className={classes.muted}>
                        Authenticated test sender for deployment checks.
                    </Typography>

                    <div className={classes.statusBlock}>{settingsText}</div>

                    <div className={classes.form}>
                        <TextField
                            label="Recipient"
                            value={this.state.to}
                            helperText="Leave blank to use the configured default recipient."
                            onChange={event => this.setState({ to: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Subject"
                            value={this.state.subject}
                            onChange={event => this.setState({ subject: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Body"
                            value={this.state.body}
                            onChange={event => this.setState({ body: event.target.value })}
                            multiline
                            minRows={5}
                            fullWidth
                        />
                        <div className={classes.actions}>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={this.state.isSending || this.state.isLoadingSettings}
                                onClick={this.handleSend}
                            >
                                Send test email
                            </Button>
                            <Button disabled={this.state.isLoadingSettings} onClick={this.loadSettings}>
                                Refresh settings
                            </Button>
                        </div>
                    </div>

                    {this.state.error && <Typography className={classes.error}>{this.state.error}</Typography>}
                    {resultText && <div className={classes.statusBlock}>{resultText}</div>}
                </Paper>
            </div>
        );
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

export default connect(mapStateToProps)(withStyles(styles)(EmailDiagnosticsView));
