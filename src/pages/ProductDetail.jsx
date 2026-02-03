import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Divider,
  Grid,
  Paper,
  IconButton,
  LinearProgress,
  Drawer,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductForm from "../components/ProductForm";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!userData?.token) {
        setError("Token de autenticação não encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductById(id, userData.token);
        setProduct(data);
      } catch (err) {
        setError(err.message || "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, userData?.token]);

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

  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (daysUntilExpiration) => {
    if (daysUntilExpiration === null) return null;
    if (daysUntilExpiration < 0)
      return { label: "Vencido", color: "error", icon: <WarningIcon /> };
    if (daysUntilExpiration <= 7)
      return {
        label: "Vence em breve",
        color: "warning",
        icon: <WarningIcon />,
      };
    if (daysUntilExpiration <= 30)
      return {
        label: "Atenção à validade",
        color: "info",
        icon: <TrendingDownIcon />,
      };
    return {
      label: "Dentro da validade",
      color: "success",
      icon: <CheckCircleIcon />,
    };
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { label: "Sem estoque", color: "error", icon: <WarningIcon /> };
    if (stock <= 10)
      return {
        label: "Estoque baixo",
        color: "warning",
        icon: <TrendingDownIcon />,
      };
    if (stock <= 50)
      return {
        label: "Estoque moderado",
        color: "info",
        icon: <CheckCircleIcon />,
      };
    return {
      label: "Estoque bom",
      color: "success",
      icon: <CheckCircleIcon />,
    };
  };

  const getConsumptionRate = (stock, daysUntilExpiration) => {
    if (!stock || !daysUntilExpiration || daysUntilExpiration <= 0) return null;
    const ratePerDay = stock / daysUntilExpiration;
    return ratePerDay;
  };

  const formDefaultValues = useMemo(
    () =>
      product
        ? {
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            expiration_date: product.expiration_date
              ? new Date(product.expiration_date)
              : null,
            id_category:
              product.id_category ??
              categories.find((c) => c.name === product.category_name)?.id ??
              null,
          }
        : null,
    [product, categories]
  );

  const handleOpenEditDrawer = async () => {
    setFormError(null);
    setEditDrawerOpen(true);
    if (categories.length === 0 && userData?.token) {
      try {
        const data = await categoryService.getAllCategories(userData.token);
        setCategories(data);
      } catch (err) {
        setFormError(err?.message || err?.error || "Erro ao carregar categorias");
      }
    }
  };

  const handleCloseEditDrawer = () => {
    setEditDrawerOpen(false);
    setFormError(null);
  };

  const handleUpdateProduct = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const updated = await productService.updateProduct(
        id,
        data,
        userData?.token
      );
      setProduct(updated);
      setSuccessMessage("Produto atualizado com sucesso!");
      setSnackbarOpen(true);
      handleCloseEditDrawer();
    } catch (err) {
      setFormError(
        err?.message || err?.error || "Erro ao atualizar produto"
      );
    } finally {
      setFormLoading(false);
    }
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

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Produto não encontrado</Alert>
      </Box>
    );
  }

  const daysUntilExpiration = getDaysUntilExpiration(product.expiration_date);
  const expirationStatus = getExpirationStatus(daysUntilExpiration);
  const stockStatus = getStockStatus(product.stock);
  const consumptionRate = getConsumptionRate(
    product.stock,
    daysUntilExpiration,
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header com botão voltar, nome do produto e botão editar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {product.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleOpenEditDrawer}
          sx={{ whiteSpace: "nowrap" }}
        >
          Editar Produto
        </Button>
      </Box>

      {/* Alertas de Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {expirationStatus && (
          <Grid item xs={12} md={6}>
            <Alert
              severity={expirationStatus.color}
              icon={expirationStatus.icon}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {expirationStatus.label}
              </Typography>
              <Typography variant="body2">
                {daysUntilExpiration < 0
                  ? `Venceu há ${Math.abs(daysUntilExpiration)} dias`
                  : `Faltam ${daysUntilExpiration} dias para vencer`}
              </Typography>
            </Alert>
          </Grid>
        )}
        {stockStatus && (
          <Grid item xs={12} md={6}>
            <Alert severity={stockStatus.color} icon={stockStatus.icon}>
              <Typography variant="subtitle2" fontWeight="bold">
                {stockStatus.label}
              </Typography>
              <Typography variant="body2">
                {product.stock === 0
                  ? "Produto esgotado. Considere reabastecer."
                  : product.stock <= 10
                    ? "Quantidade em estoque próxima do fim."
                    : "Quantidade em estoque adequada."}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Análise de Consumo */}
      {consumptionRate && consumptionRate > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Análise de Consumo
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Para consumir todo o estoque antes do vencimento:
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {consumptionRate.toFixed(1)} unidades/dia
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {consumptionRate < 1
                  ? "Consumo baixo necessário. Estoque durará até o vencimento."
                  : consumptionRate > 5
                    ? "Atenção: consumo elevado necessário para evitar desperdício."
                    : "Taxa de consumo moderada."}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progresso de Validade
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(
                    0,
                    Math.min(100, ((365 - daysUntilExpiration) / 365) * 100),
                  )}
                  color={
                    daysUntilExpiration < 7
                      ? "error"
                      : daysUntilExpiration < 30
                        ? "warning"
                        : "success"
                  }
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {daysUntilExpiration} dias restantes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Informações do Produto */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Detalhes do Produto
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Descrição
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {product.description || "Sem descrição"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Categoria
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {product.category_name ? (
                    <Chip
                      icon={<CategoryIcon />}
                      label={product.category_name}
                      color="primary"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2">Sem categoria</Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Data de Validade
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <CalendarIcon color="action" />
                  <Typography variant="body1">
                    {formatDate(product.expiration_date)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                elevation={2}
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: "white",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <MoneyIcon />
                    <Typography variant="overline">Preço</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPrice(product.price)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, mt: 1 }}>
                    Valor unitário
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <InventoryIcon color="primary" />
                    <Typography variant="overline" color="text.secondary">
                      Quantidade
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {product.stock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    unidades disponíveis
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Drawer de edição de produto */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={handleCloseEditDrawer}
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
            <Typography variant="h6">Editar Produto</Typography>
            <IconButton
              size="small"
              onClick={handleCloseEditDrawer}
              aria-label="Fechar"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {editDrawerOpen && formDefaultValues && (
              <ProductForm
                defaultValues={formDefaultValues}
                categories={categories}
                onSubmit={handleUpdateProduct}
                onCancel={handleCloseEditDrawer}
                loading={formLoading}
                error={formError}
                submitLabel="Atualizar"
              />
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Toast de sucesso */}
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

export default ProductDetail;
