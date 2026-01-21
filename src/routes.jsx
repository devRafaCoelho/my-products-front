import { ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Account from "./pages/Account";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import theme from "./theme/theme";
import { getItem } from "./utils/storage";

function ProtectedRoutes({ redirectTo }) {
  const isAuth = getItem("token");

  return isAuth ? <Outlet /> : <Navigate to={redirectTo} />;
}

export default function MainRoutes() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoutes redirectTo="/login" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/account" element={<Account />} />{" "}
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
