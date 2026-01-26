import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";
import categoryService from "../services/categoryService";

function Products() {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    id_category: "",
    expiration_date: "",
  });

  // Refs para valores atuais sem causar re-render
  const currentParamsRef = useRef({
    page: pagination.page,
    limit: pagination.limit,
    search: "",
    id_category: "",
    expiration_date: "",
  });

  // Atualizar refs quando valores mudarem
  useEffect(() => {
    currentParamsRef.current = {
      page: pagination.page,
      limit: pagination.limit,
      search: debouncedSearchTerm,
      id_category: filters.id_category,
      expiration_date: filters.expiration_date,
    };
  });

  // Debounce para o searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    if (!userData?.token) return;
    try {
      const data = await categoryService.getAllCategories(userData.token);
      setCategories(data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }, [userData?.token]);

  const fetchProducts = useCallback(async () => {
    if (!userData?.token) {
      setLoading(false);
      setError("Token de autenticação não encontrado. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = currentParamsRef.current;
      const queryParams = {
        page: params.page,
        limit: params.limit,
      };

      if (params.search) {
        queryParams.search = params.search;
      }

      if (params.id_category) {
        queryParams.id_category = params.id_category;
      }

      if (params.expiration_date) {
        queryParams.expiration_date = params.expiration_date;
      }

      const response = await productService.getAllProducts(
        userData.token,
        queryParams,
      );

      setProducts(response.data || []);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (err) {
      setError(err.message || "Erro ao carregar produtos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Carregar produtos quando parâmetros mudarem
  useEffect(() => {
    const shouldResetPage =
      debouncedSearchTerm !== "" ||
      filters.id_category ||
      filters.expiration_date;

    if (shouldResetPage && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchProducts();
    }
  }, [
    debouncedSearchTerm,
    filters.id_category,
    filters.expiration_date,
    pagination.page,
    pagination.limit,
    fetchProducts,
  ]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleViewProduct = (id) => {
    navigate(`/products/${id}`);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(productToDelete.id, userData?.token);
      setSuccessMessage(
        `Produto "${productToDelete.name}" excluído com sucesso!`,
      );
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts(); // Recarregar a lista
    } catch (err) {
      setError(err.message || "Erro ao deletar produto");
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleSearchChange = (event) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
    // A página será resetada quando o debouncedSearchTerm mudar
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      id_category: "",
      expiration_date: "",
    });
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1, // Resetar para primeira página
    }));
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string") {
      return order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return order === "asc" ? aValue - bValue : bValue - aValue;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header com título e botões */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Produtos
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder="Buscar produtos..."
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDrawerOpen(true)}
          >
            Filtrar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} disabled>
            Novo Produto
          </Button>
        </Box>
      </Box>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabela de produtos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                >
                  Nome
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "description"}
                  direction={orderBy === "description" ? order : "asc"}
                  onClick={() => handleRequestSort("description")}
                >
                  Descrição
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "price"}
                  direction={orderBy === "price" ? order : "asc"}
                  onClick={() => handleRequestSort("price")}
                >
                  Preço
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "stock"}
                  direction={orderBy === "stock" ? order : "asc"}
                  onClick={() => handleRequestSort("stock")}
                >
                  Estoque
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "expiration_date"}
                  direction={orderBy === "expiration_date" ? order : "asc"}
                  onClick={() => handleRequestSort("expiration_date")}
                >
                  Data de Validade
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "category_name"}
                  direction={orderBy === "category_name" ? order : "asc"}
                  onClick={() => handleRequestSort("category_name")}
                >
                  Categoria
                </TableSortLabel>
              </TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{formatDate(product.expiration_date)}</TableCell>
                  <TableCell>{product.category_name || "-"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizar produto">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir produto">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Controles de paginação */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Controle de limite de itens por página (esquerda) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">Itens por página:</Typography>
            <Select
              value={pagination.limit}
              onChange={handleLimitChange}
              size="small"
              sx={{ minWidth: 70 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
            <Typography variant="body2" sx={{ ml: 2 }}>
              Total: {pagination.total}{" "}
              {pagination.total === 1 ? "produto" : "produtos"}
            </Typography>
          </Box>

          {/* Controles de navegação de página (direita) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">
              Página {pagination.page} de {pagination.totalPages || 1}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<NavigateBeforeIcon />}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outlined"
                size="small"
                endIcon={<NavigateNextIcon />}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Próxima
              </Button>
            </Box>
          </Box>
        </Box>
      </TableContainer>

      {/* Drawer de filtros */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Filtro por categoria */}
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filters.id_category}
                label="Categoria"
                onChange={(e) =>
                  handleFilterChange("id_category", e.target.value)
                }
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtro por data de validade */}
            <TextField
              fullWidth
              label="Data de Validade"
              type="date"
              value={filters.expiration_date}
              onChange={(e) =>
                handleFilterChange("expiration_date", e.target.value)
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Botões de ação */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button fullWidth variant="outlined" onClick={handleClearFilters}>
                Limpar
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir o produto "{productToDelete?.name}"?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            autoFocus
            variant="outlined"
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

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

export default Products;
