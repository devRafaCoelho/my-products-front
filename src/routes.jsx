import CssBaseline from "@mui/material/CssBaseline";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Finance from "./pages/Finance";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Signup from "./pages/Signup";
import { getItem } from "./utils/storage";
import ProductDetail from "./pages/ProductDetail";

function ProtectedRoutes({ redirectTo }) {
  const userData = getItem("user");
  const isAuth = userData ? JSON.parse(userData)?.token : null;

  return isAuth ? (
    <>
      <Header />
      <Outlet />
    </>
  ) : (
    <Navigate to={redirectTo} />
  );
}

export default function MainRoutes() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Routes>
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoutes redirectTo="/login" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/finance" element={<Finance />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
