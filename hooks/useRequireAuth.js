import {useRouter} from "next/router";
import {useEffect} from "react";
import {useUserContext} from "@/context/UserContext";

export default function useRequireAuth() {
    const router = useRouter();
    const {state, dispatch} = useUserContext();

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.location.pathname === "/auth/callback") {
            return;
        }
        if (state.loggedIn && state.token) {
            return;
        }
        const storedToken = window.sessionStorage.getItem("token");

        if (storedToken) {
            dispatch({type: "login", token: storedToken});
            return;
        }
        window.sessionStorage.setItem("postLoginRedirect", router.asPath);
        window.location.href = "/api/auth/signin";

    }, [state.loggedIn, state.token, dispatch, router]);
}
