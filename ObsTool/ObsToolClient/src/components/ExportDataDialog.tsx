import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Api from "src/api/Api";

type ExportType = "simple" | "advanced";

export interface IExportDataDialogProps {
    open: boolean;
    onClose: () => void;
}

// Renders the user data export dialog and owns the export download workflow.
export default function ExportDataDialog(props: IExportDataDialogProps) {
    const [exportType, setExportType] = React.useState<ExportType>("simple");
    const [exportDownloadInProgress, setExportDownloadInProgress] = React.useState(false);
    const [exportError, setExportError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (props.open) {
            setExportType("simple");
            setExportDownloadInProgress(false);
            setExportError(null);
        }
    }, [props.open]);

    // Closes the dialog unless a download is currently being prepared.
    const handleClose = () => {
        if (exportDownloadInProgress) {
            return;
        }

        props.onClose();
    };

    // Tracks the selected export size so the download button can call the matching API endpoint.
    const handleChangeExportType = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExportType(event.target.value as ExportType);
        setExportError(null);
    };

    // Downloads the current user's export file using the filename supplied by the backend.
    const handleDownloadExport = () => {
        setExportDownloadInProgress(true);
        setExportError(null);

        Api.exportUserData(exportType).then(
            (response) => {
                const blobUrl = window.URL.createObjectURL(response.data);
                const downloadLink = document.createElement("a");
                downloadLink.href = blobUrl;
                downloadLink.download = getFileNameFromContentDisposition(response.headers["content-disposition"])
                    ?? (exportType === "simple" ? "obstool-user-data-simple.txt" : "obstool-user-data-advanced.xlsx");
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();
                window.URL.revokeObjectURL(blobUrl);

                setExportDownloadInProgress(false);
                props.onClose();
            },
            () => {
                setExportDownloadInProgress(false);
                setExportError("Export failed. Please try again.");
            }
        );
    };

    return (
        <Dialog
            open={props.open}
            onClose={handleClose}
            aria-labelledby="export-data-dialog-title"
        >
            <DialogTitle id="export-data-dialog-title">Export data</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Export only your own sessions, observations, resources, and related catalog references.
                </DialogContentText>
                <FormControl component="fieldset" margin="normal">
                    <RadioGroup
                        aria-label="Export format"
                        name="export-format"
                        value={exportType}
                        onChange={handleChangeExportType}
                    >
                        <FormControlLabel
                            value="simple"
                            control={<Radio />}
                            label="Simple/small (.txt)"
                        />
                        <FormControlLabel
                            value="advanced"
                            control={<Radio />}
                            label="Advanced/large (.xlsx)"
                        />
                    </RadioGroup>
                </FormControl>
                {exportError && (
                    <Typography color="error" variant="body2">
                        {exportError}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={exportDownloadInProgress}>
                    Cancel
                </Button>
                <Button
                    onClick={handleDownloadExport}
                    disabled={exportDownloadInProgress}
                    startIcon={<FileDownloadIcon />}
                >
                    {exportDownloadInProgress ? "Preparing..." : "Download"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Extracts the RFC 5987/standard content-disposition filename emitted by ASP.NET Core file results.
function getFileNameFromContentDisposition(contentDisposition: string | undefined) {
    if (!contentDisposition) {
        return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    }

    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? null;
}
