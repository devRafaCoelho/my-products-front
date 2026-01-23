import { useContext, useEffect, useState } from "react";
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
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";

function Products() {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (userData?.token) {
      fetchProducts();
    } else {
      setLoading(false);
      setError("Token de autenticação não encontrado. Faça login novamente.");
    }
  }, [userData]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAllProducts(userData?.token);
      setProducts(data);
    } catch (err) {
      setError(err.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

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
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setSuccessMessage(
        `Produto "${productToDelete.name}" excluído com sucesso!`,
      );
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setError(err.message || "Erro ao deletar produto");
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <Button variant="outlined" startIcon={<FilterListIcon />} disabled>
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
                  active={orderBy === "category"}
                  direction={orderBy === "category" ? order : "asc"}
                  onClick={() => handleRequestSort("category")}
                >
                  Categoria
                </TableSortLabel>
              </TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProducts.length === 0 ? (
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
                  <TableCell>{product.category}</TableCell>
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
      </TableContainer>

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
