import * as React from "react";
import { Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import ListView from "./ListView";

export const routes = <Layout>
    <Route exact={true} path="/" component={Home} />
    <Route path="/sessions" component={ListView} />
    <Route path="/newsession" component={ListView} />
    <Route path="/search" component={ListView} />
</Layout>;
