import * as React from "react";
import { Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import ListView from "./ListView";
import NewObsSessionView from "./NewObsSessionView";
import SingleObsSessionView from "./SingleObsSessionView";
import SearchView from "./SearchView";

export const routes = <Layout>
    <Route exact={true} path="/" component={Home} />
    <Route path="/session/:obsSessionId" component={SingleObsSessionView} />
    <Route path="/sessions" component={ListView} />
    <Route path="/newsession" component={NewObsSessionView} />
    <Route path="/search" component={SearchView} />
</Layout>;
