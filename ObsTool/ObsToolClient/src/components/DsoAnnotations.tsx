import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IDsoAnnotationsProps {
  rating?: number;
  followUp?: boolean;
}

const DsoAnnotations = (props: IDsoAnnotationsProps) => {
  let ratingIcons = null;
  switch (props.rating) {
    case -1:
      ratingIcons = <span title="Not a very interesting object!">
        <FontAwesomeIcon icon="thumbs-down" className="faSpaceAfter" />
      </span>;
      break;
    case 1:
      ratingIcons = <span title="Nice object!">
        <FontAwesomeIcon icon="star" className="faSpaceAfter" />
      </span>;
      break;
    case 2:
      ratingIcons = <span title="Very nice object!">
        <FontAwesomeIcon icon="star" className="faSpaceAfter" />
        <FontAwesomeIcon icon="star" className="faSpaceAfter" />
      </span>;
      break;
    default:
  }

  const followUpIcon = props.followUp ?
    <span title="Should revisit object"><FontAwesomeIcon icon="undo-alt" className="faSpaceAfter" style={{ marginLeft: "0.5em" }} /></span>
    : null;

  return <>
    {ratingIcons}
    {followUpIcon}
  </>;
};

export default DsoAnnotations;
