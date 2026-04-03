import Link from "next/link";
import { useRouter } from "next/router";
import { useUserContext } from "@/context/UserContext";

export default function AppHeader() {
    const router = useRouter();
    const { state, dispatch } = useUserContext();

    const handleLogout = () => {
        dispatch({ type: "logout" });
        window.location.href = "/api/auth/signin";
    };

    const isActive = (path) => router.pathname.startsWith(path);

    return (
        <header style={headerStyle}>
            {/* LEFT SECTION — LOGO + NAV */}
            <div style={leftStyle}>
                <Link href="/" style={logoStyle}>
                    <span style={{color: "#00AEEF", fontWeight: 700}}>visual</span>
                    <span style={{color: "#fff", fontWeight: 700}}>Dx</span>
                    <span style={{color: "#fff"}}>&nbsp;&nbsp;(Demo)</span>
                </Link>

                <nav style={navStyle}>
                    <NavItem href="/" active={isActive("/")}>
                        Home
                    </NavItem>
                    <NavItem href="/diagnosis-search" active={isActive("/diagnosis-search")}>
                        Diagnosis Search
                    </NavItem>
                    <NavItem href="/image-gallery" active={isActive("/image-gallery")}>
                        Image Gallery
                    </NavItem>
                    <NavItem href="/diagnosis/52301" active={isActive("/diagnosis/")}>
                        Diagnosis Details
                    </NavItem>
                    <NavItem href="https://healthvault.phamiliar.ai/" active={isActive("https://healthvault.phamiliar.ai/")}>
                        MCP Client
                    </NavItem>
                </nav>
            </div>

            {/* RIGHT SECTION — USER */}
            <div style={rightStyle}>
                <nav style={navStyle}>
                </nav>
                    {state.loggedIn && (
                        <>
                            <span style={emailStyle}>{state.email}</span>
                            <button style={logoutBtnStyle} onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    )}

                    {!state.loggedIn && (
                        <button
                            style={logoutBtnStyle}
                            onClick={() => (window.location.href = "/api/auth/signin")}
                        >
                            Login
                        </button>
                    )}
            </div>
        </header>
);
}

// ---------------------------- COMPONENT: NavItem ----------------------------

function NavItem({ href, active, children }) {
    return (
        <Link
            href={href}
            style={{
                padding: "6px 10px",
                borderRadius: "4px",
                color: active ? "#00AEEF" : "#d1d5db",
                textDecoration: "none",
                fontSize: 15,
                transition: "all 0.15s ease",
            }}
        >
            {children}
        </Link>
    );
}

// ---------------------------- HEADER STYLES ----------------------------

const headerStyle = {
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    background: "#1c1f26",
    borderBottom: "1px solid #2a2f36",
    position: "sticky",
    top: 0,
    zIndex: 100,
};

const leftStyle = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
};

const logoStyle = {
    display: "flex",
    alignItems: "center",
    fontSize: 20,
    fontWeight: 700,
    textDecoration: "none",
};

const navStyle = {
    display: "flex",
    alignItems: "center",
    gap: "18px",
};

const rightStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
};

const emailStyle = {
    fontSize: 14,
    color: "#e5e7eb",
};

const logoutBtnStyle = {
    padding: "6px 12px",
    fontSize: 14,
    borderRadius: "6px",
    border: "1px solid #374151",
    background: "#2a2f36",
    color: "#e5e7eb",
    cursor: "pointer",
    transition: "all 0.15s ease",
};
