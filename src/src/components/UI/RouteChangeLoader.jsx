import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";

export default function RouteChangeLoader({ minDuration = 350 }) {
  const { pathname } = useLocation();
  const { show, hide } = useLoading();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let cancelled = false;
    show("Loading page…");
    const t = setTimeout(() => !cancelled && hide(), Math.max(200, minDuration));
    return () => { cancelled = true; clearTimeout(t); };
  }, [pathname, show, hide, minDuration]);

  return null;
}
