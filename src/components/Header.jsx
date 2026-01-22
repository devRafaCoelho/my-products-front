import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import { getItem, logOut } from "../utils/storage";

const routes = [
  { label: "Home", path: "/home", icon: <HomeIcon /> },
  { label: "Produtos", path: "/products", icon: <InventoryIcon /> },
  { label: "Finanças", path: "/finance", icon: <AttachMoneyIcon /> },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useContext(ThemeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const userData = JSON.parse(getItem("user") || "{}");
  const firstName = userData.firstname || "";
  const lastName = userData.lastname || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const currentTab = routes.findIndex(
    (route) => route.path === location.pathname,
  );

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleAccount = () => {
    handleCloseUserMenu();
    navigate("/account");
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logOut();
    navigate("/login");
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    navigate(routes[newValue].path);
  };

  const handleMobileNavigate = (path) => {
    navigate(path);
    handleCloseNavMenu();
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        {isMobile ? (
          <>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleOpenNavMenu}
            >
              <MenuIcon />
            </IconButton>
            <Box
              sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
              <Typography variant="h6" fontWeight={700} color="primary">
                Estoque Inteligente
              </Typography>
            </Box>
            <IconButton onClick={handleOpenUserMenu}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {initials}
              </Avatar>
            </IconButton>
          </>
        ) : (
          <>
            <Typography
              variant="h6"
              fontWeight={700}
              color="primary"
              sx={{ mr: 4 }}
            >
              Estoque Inteligente
            </Typography>
            <Box
              sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
              <Tabs
                value={currentTab !== -1 ? currentTab : false}
                onChange={handleTabChange}
              >
                {routes.map((route) => (
                  <Tab key={route.path} label={route.label} />
                ))}
              </Tabs>
            </Box>
            <IconButton onClick={handleOpenUserMenu}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {initials}
              </Avatar>
            </IconButton>
          </>
        )}
      </Toolbar>

      {/* Menu do Avatar */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleAccount}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Minha conta</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={toggleTheme}>
          <ListItemIcon>
            {mode === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          <Switch checked={mode === "dark"} size="small" />
        </MenuItem>
      </Menu>

      {/* Menu Mobile de Navegação */}
      <Menu
        anchorEl={anchorElNav}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {routes.map((route) => (
          <MenuItem
            key={route.path}
            onClick={() => handleMobileNavigate(route.path)}
          >
            <ListItemIcon>{route.icon}</ListItemIcon>
            <ListItemText>{route.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog de Confirmação de Logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Confirmar saída</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Tem certeza que deseja sair da sua conta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmLogout}
            color="primary"
            variant="contained"
            autoFocus
          >
            Sair
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

export default Header;
