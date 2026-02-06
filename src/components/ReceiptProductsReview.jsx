import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

function ReceiptProductsReview({
  open,
  onClose,
  products: initialProducts,
  categories = [],
  onSubmit,
  loading = false,
  error,
}) {
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      // Converte category (nome) para id_category se necessário
      const mappedProducts = initialProducts.map((product) => {
        const categoryObj = categories.find(
          (cat) => cat.name?.toLowerCase() === product.category?.toLowerCase()
        );
        return {
          ...product,
          id_category: categoryObj?.id || null,
          expiration_date: product.expiration_date
            ? dayjs(product.expiration_date)
            : null,
        };
      });
      setProducts(mappedProducts);
    }
  }, [initialProducts, categories]);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...products[index] });
  };

  const handleSaveEdit = (index) => {
    const updated = [...products];
    updated[index] = {
      ...editForm,
      expiration_date: editForm.expiration_date
        ? editForm.expiration_date.format("YYYY-MM-DD")
        : null,
    };
    setProducts(updated);
    setEditingIndex(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const handleDelete = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleFieldChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSubmit = () => {
    // Converte os produtos para o formato esperado pela API
    const formattedProducts = products.map((product) => {
      // Garante que todos os campos estão no formato correto
      const formatted = {
        name: String(product.name || "").trim(),
        description: String(product.description || "").trim(),
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock, 10) || 0,
      };

      // Adiciona expiration_date apenas se existir e for válido
      if (product.expiration_date) {
        // Se for um objeto dayjs, converte para string
        if (product.expiration_date.format) {
          formatted.expiration_date = product.expiration_date.format("YYYY-MM-DD");
        } else if (typeof product.expiration_date === "string") {
          formatted.expiration_date = product.expiration_date;
        } else if (product.expiration_date instanceof Date) {
          formatted.expiration_date = product.expiration_date.toISOString().split("T")[0];
        }
      }

      // Adiciona id_category apenas se existir e for válido
      if (product.id_category) {
        // Converte para número se for string
        const categoryId = typeof product.id_category === "string" 
          ? parseInt(product.id_category, 10) 
          : product.id_category;
        
        if (!isNaN(categoryId) && categoryId > 0) {
          formatted.id_category = categoryId;
        }
      }

      return formatted;
    });

    console.log("Produtos formatados para envio:", {
      quantidade: formattedProducts.length,
      primeiroProduto: formattedProducts[0],
      formato: Array.isArray(formattedProducts) ? "array" : typeof formattedProducts,
    });

    onSubmit(formattedProducts);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">
            Revisar Produtos Extraídos ({products.length})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {products.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              Nenhum produto encontrado na nota fiscal.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Preço</TableCell>
                    <TableCell align="right">Estoque</TableCell>
                    <TableCell>Validade</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      {editingIndex === index ? (
                        <>
                          <TableCell>
                            <TextField
                              size="small"
                              value={editForm.name || ""}
                              onChange={(e) =>
                                handleFieldChange("name", e.target.value)
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={editForm.description || ""}
                              onChange={(e) =>
                                handleFieldChange("description", e.target.value)
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={editForm.price || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              inputProps={{ step: 0.01, min: 0 }}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={editForm.stock || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  "stock",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              inputProps={{ min: 0 }}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <LocalizationProvider
                              dateAdapter={AdapterDayjs}
                              adapterLocale="pt-br"
                            >
                              <DatePicker
                                value={editForm.expiration_date}
                                onChange={(date) =>
                                  handleFieldChange("expiration_date", date)
                                }
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </TableCell>
                          <TableCell>
                            <Autocomplete
                              size="small"
                              options={categories}
                              getOptionLabel={(option) => option?.name || ""}
                              value={
                                categories.find(
                                  (c) => c.id === editForm.id_category
                                ) || null
                              }
                              onChange={(_, newValue) =>
                                handleFieldChange(
                                  "id_category",
                                  newValue?.id || null
                                )
                              }
                              renderInput={(params) => (
                                <TextField {...params} fullWidth />
                              )}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit(index)}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <CancelIcon />
                            </IconButton>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            {product.description || (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(product.price)}
                          </TableCell>
                          <TableCell align="right">{product.stock}</TableCell>
                          <TableCell>
                            {product.expiration_date
                              ? dayjs(product.expiration_date).format(
                                  "DD/MM/YYYY"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {categories.find(
                              (c) => c.id === product.id_category
                            )?.name || (
                              <Chip
                                label={product.category || "Sem categoria"}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(index)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={products.length === 0 || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Cadastrar {products.length} Produto{products.length !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReceiptProductsReview;
