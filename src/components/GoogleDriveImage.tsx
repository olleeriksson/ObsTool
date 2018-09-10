import * as React from "react";

interface IOGoogleDriveImageProps {
    imageId?: string;
    title?: string;
    driveMaxWidth: string;
    driveMaxHeight: string;
}

const GoogleDriveImage: React.SFC<IOGoogleDriveImageProps> = (props) => {
    if (props.imageId) {
        const src = "https://drive.google.com/thumbnail?id=" + props.imageId + "&sz=w" + props.driveMaxWidth + "-h" + props.driveMaxHeight;
        return <img src={src} title={props.title} />;
    } else {
        return <div>Enter a valid and public image id!</div>;
    }
};

export default GoogleDriveImage;
