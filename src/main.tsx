import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from "react-router";
import TablePage from './pages/TablePage.tsx';
import FormPage from './pages/FormPage.tsx';
import Form2Page from './pages/Form2Page.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <FormPage /> },
      { path: "form2", element: <Form2Page /> },
      { path: "table", element: <TablePage /> },
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
