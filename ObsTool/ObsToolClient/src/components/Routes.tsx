import * as React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import ListView from "./ListView";
import ObservedDsos from "./ObservedDsos";
import NewObsSessionView from "./NewObsSessionView";
import SingleObsSessionView from "./SingleObsSessionView";
import SearchView from "./SearchView";
import LocationsView from "./LocationsView";
import InstrumentsView from "./InstrumentsView";
import EyepiecesView from "./EyepiecesView";
import EmailDiagnosticsView from "./EmailDiagnosticsView";

function SingleObsSessionRoute() {
    const { obsSessionId } = useParams<{ obsSessionId: string }>();
    return (
        <Layout>
            <SingleObsSessionView obsSessionId={Number(obsSessionId)} />
        </Layout>
    );
}

export const routes = (
    <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/session/:obsSessionId" element={<SingleObsSessionRoute />} />
        <Route path="/observations" element={<Layout><ObservedDsos /></Layout>} />
        <Route path="/sessions" element={<Layout><ListView /></Layout>} />
        <Route path="/newsession" element={<Layout><NewObsSessionView /></Layout>} />
        <Route path="/search" element={<Layout><SearchView /></Layout>} />
        <Route path="/locations" element={<Layout><LocationsView /></Layout>} />
        <Route path="/instruments" element={<Layout><InstrumentsView /></Layout>} />
        <Route path="/eyepieces" element={<Layout><EyepiecesView /></Layout>} />
        <Route path="/diagnostics/email" element={<Layout><EmailDiagnosticsView /></Layout>} />
    </Routes>
);
