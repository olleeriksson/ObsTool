import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { connect } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { bindActionCreators, Dispatch } from "redux";
import * as authenticationAction from "../actions/AuthenticationActions";
import Api from "src/api/Api";
import { IAppState, IDataState } from "src/types/Types";

interface IRequireLoginProps {
    children: React.ReactNode;
    actions: any;
    store: IDataState;
}

function RequireLogin(props: IRequireLoginProps) {
    const location = useLocation();
    const [isChecking, setIsChecking] = React.useState(!props.store.hasCheckedAuthentication);

    React.useEffect(() => {
        let isMounted = true;
        setIsChecking(!props.store.isLoggedIn);

        Api.isLoggedIn().then(
            response => {
                if (!isMounted) {
                    return;
                }

                if (response.data.isLoggedIn) {
                    props.actions.setLoggedIn(response.data);
                } else {
                    props.actions.setLoggedOut();
                }
                setIsChecking(false);
            },
            () => {
                if (!isMounted) {
                    return;
                }

                props.actions.setLoggedOut();
                setIsChecking(false);
            }
        );

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    if (isChecking && !props.store.isLoggedIn) {
        return (
            <div style={{ marginTop: 48, textAlign: "center" }}>
                <CircularProgress />
                <Typography color="textSecondary">Checking login...</Typography>
            </div>
        );
    }

    if (!props.store.isLoggedIn) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{props.children}</>;
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

const mapDispatchToProps = (dispatch: Dispatch<authenticationAction.AuthenticationAction>) => {
    return {
        actions: bindActionCreators(
            { ...authenticationAction },
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(RequireLogin);
