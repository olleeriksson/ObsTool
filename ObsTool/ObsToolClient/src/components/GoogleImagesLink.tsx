import * as React from "react";
import { Link } from "@material-ui/core";

interface IGoogleImagesLinkProps {
  linkTitle: string;
  searchTerms: string[];
}

const GoogleImagesLink = (props: IGoogleImagesLinkProps) => {
  const searchTerm = props.searchTerms
    .filter(term => !!term)  // only defined ones
    .map(term => term.replace(/\ /g, "+"))   // replace all empty spaces with +'es
    .map(term => "\"" + term + "\"")  // encapsulate with " "
    .join("+");

  const url = "http://www.google.com/search?q=" + searchTerm + "&tbm=isch";

  // Add this to the <Link> below:
  //   onClick={onClickLink}
  const onClickLink = () => {
    window.open(url, "popup", "width=1000,height=700");
    return false;
  };

  return (
    <>
      {/* <a href={url}>{props.linkTitle}</a> */}
      <Link href={url} variant="caption" target="_blank">
        {props.linkTitle}
      </Link>
    </>
  );
};

export default GoogleImagesLink;
