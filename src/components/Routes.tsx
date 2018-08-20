import * as React from "react";
import { Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import ObsSessionList from "./ObsSessionList";
import ObsSessionListAndForm from "./ObsSessionListAndForm";

export const routes = <Layout>
    <Route exact={true} path="/" component={Home} />
    <Route path="/sessions" component={ObsSessionList} />
    <Route path="/newsession" component={ObsSessionListAndForm} />
    <Route path="/search" component={ObsSessionList} />
</Layout>;
