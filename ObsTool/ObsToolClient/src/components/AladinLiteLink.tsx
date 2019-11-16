import * as React from "react";
import { Link } from "@material-ui/core";

interface IAladinLiteLinkProps {
  linkTitle: string;
  searchTerm: string;
}

const AladinLiteLink = (props: IAladinLiteLinkProps) => {
  const searchTerm = props.searchTerm.replace(/\ /g, "+");  // replace all empty spaces with +'es
  const url = "http://aladin.unistra.fr/AladinLite/?target=" + searchTerm + "&fov=2.27&survey=P%2FDSS2%2Fcolor";

  // Add this to the <Link> below:
  //   onClick={onClickLink}
  const onClickLink = () => {
    window.open(url, "popup", "width=1000,height=700");
    return false;
  };

  return (
    <>
      {/* <a href={url} target="_blank">{props.linkTitle}</a> */}
      <Link href={url} variant="caption" target="_blank">
        {props.linkTitle}
      </Link>
    </>
  );
};

export default AladinLiteLink;
