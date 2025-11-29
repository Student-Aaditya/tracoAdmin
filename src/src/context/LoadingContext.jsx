import { createContext, useContext, useState, useCallback } from "react";

// Give the context a stable default so consumers never crash
const defaultLoading = {
  visible: false,
  message: "Loading…",
  show: () => {},
  hide: () => {},
};

const LoadingCtx = createContext(defaultLoading);

export function LoadingProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Loading…");

  const show = useCallback((msg) => {
    if (msg) setMessage(msg);
    setVisible(true);
  }, []);
  const hide = useCallback(() => setVisible(false), []);

  return (
    <LoadingCtx.Provider value={{ visible, message, show, hide }}>
      {children}
    </LoadingCtx.Provider>
  );
}

// Export the hook as a named function (stable for Fast Refresh)
export function useLoading() {
  return useContext(LoadingCtx);
}
