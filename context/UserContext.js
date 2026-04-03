import { createContext, useContext, useReducer, useEffect } from "react";

const parseJwt = (token) =>
    JSON.parse(
        window.atob(token.split(".")[1].replace("-", "+").replace("_", "/"))
    );

// ----------------------------------------------------------------------------
// JWT Helper Class
// ----------------------------------------------------------------------------
class JWT {
    constructor(token) {
        this.token = token;
        this.decoded = parseJwt(token || "..") || {};
    }

    get exp() {
        return this.decoded ? this.decoded.exp : 0;
    }

    get iat() {
        return this.decoded ? this.decoded.iat : Number.POSITIVE_INFINITY;
    }

    validate() {
        const now = Date.now();
        return this.exp * 1000 > now && this.iat * 1000 < now;
    }

    asState() {
        return {
            token: this.token,
            name: this.decoded.name,
            email: this.decoded.email,
            groups: this.decoded["cognito:groups"] || [],
            partnerId: this.decoded["custom:partnerId"] || "",
        };
    }
}

// ----------------------------------------------------------------------------
// Initial State
// ----------------------------------------------------------------------------
export const getInitialUserState = () => ({
    loggedIn: false,
    token: null,
    name: null,
    email: null,
    groups: [],
    partnerId: "",
});

// ----------------------------------------------------------------------------
// Reducer
// ----------------------------------------------------------------------------
const userStateReducer = (state, action) => {
    switch (action?.type) {
        case "login": {
            const jwt = new JWT(action.token);
            if (jwt.validate()) {
                console.log("[UserContext] Login OK. Saving token.");
                window.sessionStorage.setItem("token", action.token);
                return { ...state, loggedIn: true, ...jwt.asState() };
            }
            console.warn("[UserContext] Invalid token, falling through to logout");
        }

        case "logout":
            console.log("[UserContext] Logout");
            window.sessionStorage.removeItem("token");
            return getInitialUserState();

        default:
            return state;
    }
};

// ----------------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------------
const UserContext = createContext({
    state: getInitialUserState(),
    dispatch: () => null,
});

// ----------------------------------------------------------------------------
// Provider (GLOBAL)
// ----------------------------------------------------------------------------
export function UserProvider({ children }) {
    const [state, dispatch] = useReducer(
        userStateReducer,
        getInitialUserState()
    );

    // Restore token after page reload
    useEffect(() => {
        const restored = window.sessionStorage.getItem("token");
        if (restored) {
            console.log("[UserContext] Restoring token from sessionStorage");
            dispatch({ type: "login", token: restored });
        }
    }, []);

    return (
        <UserContext.Provider value={{ state, dispatch }}>
            {children}
        </UserContext.Provider>
    );
}

// ----------------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------------
export const useUserContext = () => useContext(UserContext);

export function useToken(receiver) {
    const { state } = useUserContext();
    return (...args) => receiver(state.token, ...args);
}
