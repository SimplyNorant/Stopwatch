import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import NotFoundPage from "./components/Pages/NotFoundPage.tsx";
import PrivacyPolicy from "./components/Pages/PrivacyPolicy.tsx";
import ResetPassword from "./components/Pages/ResetPassword.tsx";
import ErrorPage from "./components/Pages/ErrorPage.tsx";
import NoteSystem from "./components/Pages/NoteSystem.tsx";

import { SharedProvider } from "./assets/SharedContent.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App />, errorElement: <ErrorPage /> },
  { path: "/notes", element: <NoteSystem /> },
  { path: "/PrivacyPolicy", element: <PrivacyPolicy /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SharedProvider>
      <RouterProvider router={router} />
    </SharedProvider>
  </StrictMode>,
);
