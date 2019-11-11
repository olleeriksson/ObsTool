import * as React from "react";
import { Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import ListView from "./ListView";
import ObservedDsos from "./ObservedDsos";
import NewObsSessionView from "./NewObsSessionView";
import SingleObsSessionView from "./SingleObsSessionView";
import SearchView from "./SearchView";
import LocationsView from "./LocationsView";

// This whole section below is a hack because I couldn't get withRouter() to work with Typescript
// This passes the {match, location ... } object down to <Layout>, in which I then check if we are on
// the /search route and if so tell that to <SearchInput> which needs to prevent <Redirect>'s in that case.
const home = (props: any) => <Layout {...props}>
    <Home {...props} />
</Layout>;

const singleObsSessionView = (props: any) => <Layout {...props}>
    <SingleObsSessionView {...props} />
</Layout>;

const observedDsos = (props: any) => <Layout {...props}>
    <ObservedDsos {...props} />
</Layout>;

const listView = (props: any) => <Layout {...props}>
    <ListView {...props} />
</Layout>;

const newObsSessionView = (props: any) => <Layout {...props}>
    <NewObsSessionView {...props} />
</Layout>;

const searchView = (props: any) => <Layout {...props}>
    <SearchView {...props} />
</Layout>;

const locationsView = (props: any) => <Layout {...props}>
    <LocationsView {...props} />
</Layout>;

export const routes = <div>
    <Route exact={true} path="/" component={home} />
    <Route path="/session/:obsSessionId" component={singleObsSessionView} />
    <Route path="/observations" component={observedDsos} />
    <Route path="/sessions" component={listView} />
    <Route path="/newsession" component={newObsSessionView} />
    <Route path="/search" component={searchView} />
    <Route path="/locations" component={locationsView} />
</div>;

// This was the non-hacky solution that worked

// export const routes = (props: IRouteProps) => {
//     return (
//         <Layout {...props}>
//             <Route exact={true} path="/" component={Home} />
//             <Route path="/session/:obsSessionId" component={SingleObsSessionView} />
//             <Route path="/sessions" component={ListView} />
//             <Route path="/newsession" component={NewObsSessionView} />
//             <Route path="/search" component={SearchView} />
//         </Layout>
//     );
// };
