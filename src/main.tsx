import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import TablePage from "./pages/TablePage.tsx";
import FormPage from "./pages/FormPage.tsx";
import Form2Page from "./pages/Form2Page.tsx";

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
      { index: true, element: <FormPage /> },
      { path: "form2", element: <Form2Page /> },
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
