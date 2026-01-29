import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import NotFoundPage from "./components/NotFoundPage.tsx";
import PrivacyPolicy from "./components/PrivacyPolicy.tsx";
import ResetPassword from "./components/ResetPassword.tsx";
import ErrorPage from "./components/ErrorPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App />, errorElement: <ErrorPage /> },
  { path: "/PrivacyPolicy", element: <PrivacyPolicy /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
