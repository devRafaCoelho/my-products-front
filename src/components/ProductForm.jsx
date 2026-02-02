import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductSchema } from "../schemas/ProductSchema";
import {
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import PriceInput from "./inputs/PriceInput";

export default function ProductForm({
  onSubmit,
  onCancel,
  loading = false,
  categories = [],
  error,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(ProductSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      price: null,
      stock: 0,
      expiration_date: null,
      id_category: null,
    },
  });

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      expiration_date: data.expiration_date
        ? dayjs(data.expiration_date).format("YYYY-MM-DD")
        : null,
    };
    onSubmit(payload);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            pt: 3,
          }}
        >
          <Grid
            container
            spacing={3}
            sx={{ width: "100%", boxSizing: "border-box" }}
          >
            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome"
                      fullWidth
                      variant="outlined"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Estoque"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={
                        field.value === 0 || field.value ? field.value : ""
                      }
                      inputProps={{ min: 0, step: 1 }}
                      error={!!errors.stock}
                      helperText={errors.stock?.message}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? 0 : parseInt(val, 10) || 0);
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Descrição"
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <PriceInput
                      name={field.name}
                      label="Preço"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.price?.message}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="expiration_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Data de Validade"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? date.toDate() : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          error: !!errors.expiration_date,
                          helperText: errors.expiration_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <Controller
                  name="id_category"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      fullWidth
                      sx={{ width: "100%" }}
                      options={categories}
                      getOptionLabel={(option) => option?.name || ""}
                      value={
                        categories.find((c) => c.id === field.value) ?? null
                      }
                      onChange={(_, newValue) =>
                        field.onChange(newValue?.id ?? null)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Categoria"
                          variant="outlined"
                          fullWidth
                          error={!!errors.id_category}
                          helperText={errors.id_category?.message}
                          sx={{
                            "& .MuiInputBase-root": { width: "100%" },
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 2,
              mt: 4,
            }}
          >
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 120 } }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 140 } }}
              endIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Cadastrar
            </Button>
          </Box>
        </Box>
      </form>
    </LocalizationProvider>
  );
}
