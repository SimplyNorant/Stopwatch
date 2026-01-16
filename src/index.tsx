import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import NotFoundPage from "./components/NotFoundPage.tsx";
import PrivacyPolicy from "./components/PrivacyPolicy.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/PrivacyPolicy", element: <PrivacyPolicy /> },
  { path: "*", element: <NotFoundPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
