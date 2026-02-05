import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Drawer,
  IconButton,
  Snackbar,
  useTheme,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductForm from "../components/ProductForm";
import NewProductMenu from "../components/NewProductMenu";

function Home() {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    expiringProducts: [],
    lowStockProducts: [],
    totalValue: 0,
    categories: [],
    recentProducts: [],
  });
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [anchorElNewProduct, setAnchorElNewProduct] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar todos os produtos
        const productsResponse = await productService.getAllProducts(
          userData.token,
          { limit: 1000 }
        );
        const products = productsResponse.data || [];

        // Calcular dados do dashboard
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        // Produtos vencendo nos próximos 7 dias
        const expiring = products.filter((p) => {
          if (!p.expiration_date) return false;
          const expDate = new Date(p.expiration_date);
          return expDate >= today && expDate <= sevenDaysFromNow;
        });

        // Produtos com estoque baixo (<=10)
        const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);

        // Valor total do estoque
        const totalValue = products.reduce(
          (sum, p) => sum + p.price * p.stock,
          0
        );

        // Contar produtos por categoria
        const categoryCount = {};
        products.forEach((p) => {
          const catName = p.category_name || "Sem categoria";
          categoryCount[catName] = (categoryCount[catName] || 0) + 1;
        });

        // Produtos recentes (últimos 5)
        const recent = [...products]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);

        setDashboardData({
          totalProducts: products.length,
          expiringProducts: expiring,
          lowStockProducts: lowStock,
          totalValue,
          categories: Object.entries(categoryCount).map(([name, count]) => ({
            name,
            count,
          })),
          recentProducts: recent,
        });
      } catch (err) {
        setError(err.message || "Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userData?.token, dashboardRefresh]);

  const handleOpenCreateDrawer = async () => {
    setCreateDrawerOpen(true);
    setFormError(null);
    if (!userData?.token) return;
    try {
      const list = await categoryService.getAllCategories(userData.token);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setCategories([]);
    }
  };

  const handleCloseCreateDrawer = () => {
    setCreateDrawerOpen(false);
    setFormError(null);
  };

  const handleOpenNewProductMenu = (event) => {
    setAnchorElNewProduct(event.currentTarget);
  };

  const handleCloseNewProductMenu = () => {
    setAnchorElNewProduct(null);
  };

  const handleManualCreate = async () => {
    await handleOpenCreateDrawer();
  };

  const handleScanReceipt = () => {
    // Sem ação por enquanto
  };

  const handleCreateProduct = async (data) => {
    if (!userData?.token) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await productService.createProduct(data, userData.token);
      handleCloseCreateDrawer();
      setSuccessMessage("Produto cadastrado com sucesso!");
      setSnackbarOpen(true);
      setDashboardRefresh((r) => r + 1);
    } catch (err) {
      setFormError(err?.message || "Erro ao cadastrar produto");
    } finally {
      setFormLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getFirstName = () => {
    if (!userData?.firstname) return "";
    return userData.firstname.split(" ")[0];
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Olá{getFirstName() && `, ${getFirstName()}`}! Bem-vindo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Veja como está seu estoque
        </Typography>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={2}
            sx={{
              color: theme.palette.common.white,
              height: "100%",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            <CardContent
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InventoryIcon fontSize="large" />
                <Typography variant="overline">Total de Produtos</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {dashboardData.totalProducts}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  itens cadastrados
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={2}
            sx={{
              color: theme.palette.common.white,
              height: "100%",
              background:
                dashboardData.expiringProducts.length > 0
                  ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              cursor:
                dashboardData.expiringProducts.length > 0
                  ? "pointer"
                  : "default",
            }}
            onClick={() =>
              dashboardData.expiringProducts.length > 0 && navigate("/products")
            }
          >
            <CardContent
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningIcon fontSize="large" />
                <Typography variant="overline">Vencendo em 7 dias</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {dashboardData.expiringProducts.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {dashboardData.expiringProducts.length === 0
                    ? "Nenhum produto vencendo"
                    : "produtos precisam de atenção"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={2}
            sx={{
              color: theme.palette.common.white,
              height: "100%",
              background:
                dashboardData.lowStockProducts.length > 0
                  ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              cursor:
                dashboardData.lowStockProducts.length > 0
                  ? "pointer"
                  : "default",
            }}
            onClick={() =>
              dashboardData.lowStockProducts.length > 0 && navigate("/products")
            }
          >
            <CardContent
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingDownIcon fontSize="large" />
                <Typography variant="overline">Estoque Baixo</Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {dashboardData.lowStockProducts.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {dashboardData.lowStockProducts.length === 0
                    ? "Todos com estoque adequado"
                    : "produtos com pouco estoque"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MoneyIcon color="primary" fontSize="large" />
                <Typography variant="overline" color="text.secondary">
                  Valor Total
                </Typography>
              </Box>

              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatPrice(dashboardData.totalValue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                investido em estoque
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas e Categorias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Alertas Prioritários */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              <WarningIcon
                color="warning"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              Produtos que Precisam de Atenção
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {dashboardData.expiringProducts.length === 0 &&
            dashboardData.lowStockProducts.length === 0 ? (
              <Alert severity="success">
                Tudo em ordem! Nenhum produto precisa de atenção no momento.
              </Alert>
            ) : (
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {dashboardData.expiringProducts.slice(0, 3).map((product) => (
                  <ListItem
                    key={product.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "warning.light",
                      borderRadius: 1,
                      mb: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Chip
                            label="Vencendo"
                            size="small"
                            color="warning"
                            icon={<CalendarIcon />}
                          />
                        </Box>
                      }
                      secondary={`Vence em: ${formatDate(
                        product.expiration_date
                      )}`}
                    />
                  </ListItem>
                ))}

                {dashboardData.lowStockProducts.slice(0, 3).map((product) => (
                  <ListItem
                    key={product.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "error.light",
                      borderRadius: 1,
                      mb: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Chip
                            label="Baixo Estoque"
                            size="small"
                            color="error"
                            icon={<TrendingDownIcon />}
                          />
                        </Box>
                      }
                      secondary={`Apenas ${product.stock} unidades restantes`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {(dashboardData.expiringProducts.length > 3 ||
              dashboardData.lowStockProducts.length > 3) && (
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate("/products")}
              >
                Ver Todos os Produtos
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Resumo por Categoria */}
        <Grid item size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              <CategoryIcon
                color="primary"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              Produtos por Categoria
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {dashboardData.categories.length === 0 ? (
              <Alert severity="info">Nenhuma categoria cadastrada ainda.</Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {dashboardData.categories
                  .sort((a, b) => b.count - a.count)
                  .map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.count} produtos (
                          {(
                            (category.count / dashboardData.totalProducts) *
                            100
                          ).toFixed(0)}
                          %)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (category.count / dashboardData.totalProducts) * 100
                        }
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Ações Rápidas e Produtos Recentes */}
      <Grid container spacing={3}>
        {/* Ações Rápidas */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
                onClick={handleOpenNewProductMenu}
              >
                Cadastrar Novo Produto
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                fullWidth
                onClick={() => navigate("/products")}
              >
                Ver Todos os Produtos
              </Button>
              {dashboardData.expiringProducts.length > 0 && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  fullWidth
                  onClick={() => navigate("/products")}
                >
                  Ver Produtos Vencendo
                </Button>
              )}
            </Box>
            {/* Menu de opções para Novo Produto */}
            <NewProductMenu
              anchorEl={anchorElNewProduct}
              onClose={handleCloseNewProductMenu}
              onManualCreate={handleManualCreate}
              onScanReceipt={handleScanReceipt}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            />
          </Paper>
        </Grid>

        {/* Produtos Recentes */}
        <Grid item size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Produtos Recém-Adicionados
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {dashboardData.recentProducts.length === 0 ? (
              <Alert severity="info">Nenhum produto cadastrado ainda.</Alert>
            ) : (
              <List>
                {dashboardData.recentProducts.map((product, index) => (
                  <div key={product.id}>
                    <ListItem
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                        borderRadius: 1,
                      }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight="medium">
                              {product.name}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Chip
                                label={product.category_name || "Sem categoria"}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={formatPrice(product.price)}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          </Box>
                        }
                        secondary={`Estoque: ${
                          product.stock
                        } unidades • Adicionado em: ${formatDate(
                          product.created_at
                        )}`}
                      />
                    </ListItem>
                    {index < dashboardData.recentProducts.length - 1 && (
                      <Divider />
                    )}
                  </div>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Drawer Novo Produto */}
      <Drawer
        anchor="right"
        open={createDrawerOpen}
        onClose={handleCloseCreateDrawer}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: 420 },
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6">Novo Produto</Typography>
            <IconButton
              size="small"
              onClick={handleCloseCreateDrawer}
              aria-label="Fechar"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {createDrawerOpen && (
              <ProductForm
                onSubmit={handleCreateProduct}
                onCancel={handleCloseCreateDrawer}
                loading={formLoading}
                categories={categories}
                error={formError}
              />
            )}
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Home;
