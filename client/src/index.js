import React from "react";
import ReactDOM from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./auth/authContext";
import { ToastProvider } from "./components/ui/ToastProvider";

const posthogKey = process.env.REACT_APP_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.REACT_APP_POSTHOG_HOST;
const posthogOptions = {
  api_host: posthogHost,
  defaults: "2026-01-30",
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {posthogKey ? (
      <PostHogProvider apiKey={posthogKey} options={posthogOptions}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </PostHogProvider>
    ) : (
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
