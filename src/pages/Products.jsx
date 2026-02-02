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
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductForm from "../components/ProductForm";

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

  // Estados para formulário de cadastro
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    id_category: [],
    expiration_date: "",
  });
  // Filtros temporários (editados no drawer, aplicados ao clicar em Aplicar)
  const [tempFilters, setTempFilters] = useState({
    id_category: [],
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
        queryParams
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

  // Carregar produtos quando parâmetros mudarem (apenas busca e paginação automáticos)
  useEffect(() => {
    const shouldResetPage = debouncedSearchTerm !== "";

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
        `Produto "${productToDelete.name}" excluído com sucesso!`
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

  const handleTempFilterChange = (filterName, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilterDrawerOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      id_category: [],
      expiration_date: "",
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenFilterDrawer = () => {
    // Sincroniza os filtros temporários com os aplicados
    setTempFilters(filters);
    setFilterDrawerOpen(true);
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

  const handleOpenCreateDialog = () => {
    setFormError(null);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormError(null);
  };

  const handleCreateProduct = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await productService.createProduct(data, userData?.token);
      setSuccessMessage("Produto cadastrado com sucesso!");
      setSnackbarOpen(true);
      handleCloseCreateDialog();
      fetchProducts();
    } catch (err) {
      setFormError(err?.message || err?.error || "Erro ao cadastrar produto");
    } finally {
      setFormLoading(false);
    }
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
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 3,
      }}
    >
      {/* Header com título e botões */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          mb: 3,
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 0, md: 0 } }}>
          Produtos
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
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
            sx={{
              width: { xs: "100%", sm: 250 },
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexShrink: 0,
              flexWrap: "nowrap",
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleOpenFilterDrawer}
              sx={{
                whiteSpace: "nowrap",
                flex: { xs: 1, sm: "none" },
              }}
            >
              Filtrar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                whiteSpace: "nowrap",
                flex: { xs: 1, sm: "none" },
              }}
            >
              Novo Produto
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Área da tabela com scroll interno */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TableContainer
          component={Paper}
          sx={{
            flex: 1,
            overflow: "auto",
            display: "block",
          }}
        >
          <Table
            stickyHeader
            sx={{ "& .MuiTableCell-root": { whiteSpace: "nowrap" } }}
          >
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
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : sortedProducts.length === 0 ? (
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <TableCell colSpan={7} align="center">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product, index) => (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, 0.04)"
                                : "rgba(0, 0, 0, 0.04)"
                          : undefined,
                    }}
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{formatDate(product.expiration_date)}</TableCell>
                    <TableCell>{product.category_name || "-"}</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
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
                            // color="error"
                            size="small"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Controles de paginação - footer fixo */}
        <Paper
          sx={{
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              p: 2,
              gap: { xs: 1.5, sm: 3 },
              flexWrap: "wrap",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Controle de limite de itens por página */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}
              >
                Linhas por página:
              </Typography>
              <Select
                value={pagination.limit}
                onChange={handleLimitChange}
                size="small"
                variant="standard"
                sx={{
                  minWidth: 40,
                  fontSize: "0.875rem",
                  "& .MuiSelect-select": {
                    paddingRight: "24px !important",
                    paddingLeft: "0px",
                  },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </Box>

            {/* Informação de intervalo de itens */}
            <Typography
              variant="body2"
              sx={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}
            >
              {pagination.total === 0
                ? "0 de 0"
                : `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )} de ${pagination.total}`}
            </Typography>

            {/* Controles de navegação de página */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Drawer de filtros */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 350,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Filtros</Typography>
              <IconButton
                size="small"
                onClick={() => setFilterDrawerOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Filtro por categoria (múltipla seleção) */}
              <Autocomplete
                multiple
                fullWidth
                options={categories}
                getOptionLabel={(option) => option.name}
                value={categories.filter((cat) =>
                  tempFilters.id_category.includes(cat.id)
                )}
                onChange={(event, newValue) => {
                  handleTempFilterChange(
                    "id_category",
                    newValue.map((cat) => cat.id)
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categorias"
                    placeholder="Selecione categorias"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />

              {/* Filtro por data de validade */}
              <TextField
                fullWidth
                label="Data de Validade (até)"
                type="date"
                value={tempFilters.expiration_date}
                onChange={(e) =>
                  handleTempFilterChange("expiration_date", e.target.value)
                }
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Produtos que vencem até esta data"
              />
            </Box>
          </Box>

          {/* Botões de ação no rodapé */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 2,
            }}
          >
            <Button fullWidth variant="outlined" onClick={handleClearFilters}>
              Limpar
            </Button>
            <Button fullWidth variant="contained" onClick={handleApplyFilters}>
              Aplicar
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog de cadastro de produto */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        aria-labelledby="create-product-dialog-title"
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: "calc(100vh - 16px)", sm: "calc(100vh - 32px)" },
          },
        }}
      >
        <DialogTitle id="create-product-dialog-title" sx={{ pb: 0 }}>
          Novo Produto
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            px: { xs: 2, sm: 3 },
            pb: 2,
            overflowY: "auto",
            width: "100%",
            "& > *": { width: "100%", minWidth: 0 },
          }}
        >
          {createDialogOpen && (
            <ProductForm
              onSubmit={handleCreateProduct}
              onCancel={handleCloseCreateDialog}
              loading={formLoading}
              categories={categories}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>

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
