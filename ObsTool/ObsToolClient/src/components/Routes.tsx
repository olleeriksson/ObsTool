import * as React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import Layout from "./Layout";
import ChangePasswordPage from "./ChangePasswordPage";
import ConfirmEmailPage from "./ConfirmEmailPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import LoginPage from "./LoginPage";
import RequireLogin from "./RequireLogin";
import ResetPasswordPage from "./ResetPasswordPage";
import SignupPage from "./SignupPage";
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
import SystemEventLogPage from "./SystemEventLogPage";
import UserAdminPage from "./UserAdminPage";
import ObjectsView from "./ObjectsView";

function SingleObsSessionRoute() {
    const { obsSessionId } = useParams<{ obsSessionId: string }>();
    return (
        <ProtectedLayout>
            <SingleObsSessionView obsSessionId={Number(obsSessionId)} />
        </ProtectedLayout>
    );
}

function SessionsRoute() {
    const { obsSessionId } = useParams<{ obsSessionId: string }>();
    return (
        <ProtectedLayout>
            <ListView obsSessionId={obsSessionId ? Number(obsSessionId) : undefined} />
        </ProtectedLayout>
    );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireLogin>
            <Layout>{children}</Layout>
        </RequireLogin>
    );
}

export const routes = (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
        <Route path="/session/:obsSessionId" element={<SingleObsSessionRoute />} />
        <Route path="/observations" element={<ProtectedLayout><ObservedDsos /></ProtectedLayout>} />
        <Route path="/sessions/:obsSessionId" element={<SessionsRoute />} />
        <Route path="/sessions" element={<ProtectedLayout><ListView /></ProtectedLayout>} />
        <Route path="/newsession" element={<ProtectedLayout><NewObsSessionView /></ProtectedLayout>} />
        <Route path="/search" element={<ProtectedLayout><SearchView /></ProtectedLayout>} />
        <Route path="/objects" element={<ProtectedLayout><ObjectsView /></ProtectedLayout>} />
        <Route path="/locations" element={<ProtectedLayout><LocationsView /></ProtectedLayout>} />
        <Route path="/instruments" element={<ProtectedLayout><InstrumentsView /></ProtectedLayout>} />
        <Route path="/eyepieces" element={<ProtectedLayout><EyepiecesView /></ProtectedLayout>} />
        <Route path="/change-password" element={<ProtectedLayout><ChangePasswordPage /></ProtectedLayout>} />
        <Route path="/user-admin" element={<ProtectedLayout><UserAdminPage /></ProtectedLayout>} />
        <Route path="/system-events" element={<ProtectedLayout><SystemEventLogPage /></ProtectedLayout>} />
        <Route path="/diagnostics/email" element={<ProtectedLayout><EmailDiagnosticsView /></ProtectedLayout>} />
    </Routes>
);
