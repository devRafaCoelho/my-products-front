import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./routes";
import { AppProvider } from "./contexts/AppProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <MainRoutes />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
