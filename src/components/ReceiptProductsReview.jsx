import { useState, useMemo, useRef, useEffect } from "react";
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
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Usa useMemo para calcular os produtos mapeados diretamente
  const mappedProducts = useMemo(() => {
    if (!initialProducts || initialProducts.length === 0) {
      return [];
    }
    
    return initialProducts.map((product) => {
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
  }, [initialProducts, categories]);

  // Estado local para edição (inicializado com os produtos mapeados)
  const [products, setProducts] = useState(() => mappedProducts);

  // Usa useRef para rastrear a última versão dos produtos mapeados
  const prevMappedProductsRef = useRef(mappedProducts);

  // Sincroniza o estado quando mappedProducts mudar usando useLayoutEffect para evitar flicker
  // e usando uma verificação para evitar atualizações desnecessárias
  useEffect(() => {
    // Compara referências para evitar atualizações desnecessárias
    if (prevMappedProductsRef.current !== mappedProducts) {
      prevMappedProductsRef.current = mappedProducts;
      // Usa requestAnimationFrame para evitar chamada síncrona de setState
      requestAnimationFrame(() => {
        setProducts(mappedProducts);
      });
    }
  }, [mappedProducts]);

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
          formatted.expiration_date =
            product.expiration_date.format("YYYY-MM-DD");
        } else if (typeof product.expiration_date === "string") {
          formatted.expiration_date = product.expiration_date;
        } else if (product.expiration_date instanceof Date) {
          formatted.expiration_date = product.expiration_date
            .toISOString()
            .split("T")[0];
        }
      }

      // Não inclui id_category ao cadastrar produtos através do escaneamento
      // O id_category será definido pelo backend ou pode ser editado manualmente depois

      return formatted;
    });

    console.log("Produtos formatados para envio:", {
      quantidade: formattedProducts.length,
      primeiroProduto: formattedProducts[0],
      formato: Array.isArray(formattedProducts)
        ? "array"
        : typeof formattedProducts,
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
            Revisar produtos extraídos ({products.length})
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
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Preço</TableCell>
                    <TableCell>Estoque</TableCell>
                    <TableCell>Validade</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell
                      sx={{
                        minWidth: 100,
                      }}
                    >
                      Ações
                    </TableCell>
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
                          <TableCell
                            sx={{
                              whiteSpace: "nowrap",
                              width: "100px",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                flexWrap: "nowrap",
                              }}
                            >
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSaveEdit(index)}
                                sx={{
                                  flexShrink: 0,
                                  minWidth: "auto",
                                  padding: 0.5,
                                }}
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                sx={{
                                  flexShrink: 0,
                                  minWidth: "auto",
                                  padding: 0.5,
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Box>
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
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
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
                          <TableCell
                            sx={{
                              whiteSpace: "nowrap",
                              width: "100px",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                flexWrap: "nowrap",
                              }}
                            >
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(index)}
                                sx={{
                                  flexShrink: 0,
                                  minWidth: "auto",
                                  padding: 0.5,
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(index)}
                                sx={{
                                  flexShrink: 0,
                                  minWidth: "auto",
                                  padding: 0.5,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
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
