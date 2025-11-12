import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import TablePage from "./pages/TablePage.tsx";
import UserFormPage from "./pages/UserFormPage.tsx";
import CreditFormPage from "./pages/CreditFormPage.tsx";

export async function enableMocking() {
  console.log("import.meta.env.MOCK_API: ", import.meta.env.VITE_API_MOCK);
  if (import.meta.env.VITE_API_MOCK !== true) {
    return;
  }
  const { serviceWorker } = await import("./mocks/browser.ts");

  return serviceWorker.start();
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <UserFormPage /> },
      { path: "credit-form", element: <CreditFormPage /> },
      { path: "table", element: <TablePage /> },
    ],
  },
]);

enableMocking().then(() => {
  return createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
});
