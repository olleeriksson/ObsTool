import * as React from "react";

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
  return (
    <a href={url}>{props.linkTitle}</a>
  );
};

export default GoogleImagesLink;
