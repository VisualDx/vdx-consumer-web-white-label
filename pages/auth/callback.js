import { useUserContext } from "@/context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Callback() {
  const { dispatch } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;

      const token = new URLSearchParams(hash).get("id_token");

      if (!token) {
        console.error("No id_token in callback URL");
        router.replace("/");
        return;
      }

      dispatch({ type: "login", token });
      const redirectPath = window.sessionStorage.getItem("postLoginRedirect") || "/";
      window.sessionStorage.removeItem("postLoginRedirect");
      router.replace(redirectPath);
    } catch (e) {
      router.replace("/");
    }
  }, [dispatch, router]);

  return <div>Signing you in…</div>;
}
