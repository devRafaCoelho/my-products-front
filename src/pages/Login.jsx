import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoginSchema } from "../schemas/LoginSchema";
import userService from "../services/userService";
import { setItem } from "../utils/storage";
import { AppContext } from "../contexts/AppContext";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  useMediaQuery,
  Paper,
  CircularProgress,
  Alert,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

function Login() {
  const navigate = useNavigate();
  const { setUserData } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(LoginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await userService.login(data);
      const userDataWithToken = {
        ...response.user,
        token: response.token,
      };
      setItem("user", JSON.stringify(userDataWithToken));
      setUserData(userDataWithToken);
      navigate("/home");
    } catch (err) {
      setError(err?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(90deg, ${theme.palette.primary.main} 50%, ${theme.palette.background.default} 50%)`
            : `linear-gradient(90deg, ${theme.palette.primary.light} 50%, ${theme.palette.background.default} 50%)`,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: isMobile ? "100%" : 800,
          minHeight: isMobile ? "100vh" : 500,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
        }}
      >
        {!isMobile && (
          <Box
            sx={{
              flex: 1,
              background:
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={theme.typography.fontWeightBold}
              gutterBottom
            >
              Estoque Inteligente
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gerencie seu estoque doméstico com praticidade
            </Typography>
          </Box>
        )}
        {isMobile && (
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              color: theme.palette.primary.contrastText,
              py: 8,
              px: 4,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={theme.typography.fontWeightBold}
              gutterBottom
              align="center"
            >
              Estoque Inteligente
            </Typography>

            <Typography variant="body1" align="center" sx={{ opacity: 0.9 }}>
              Gerencie seu estoque doméstico com praticidade
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            p: isMobile ? 3 : 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            mt: isMobile ? -3 : 0,
            background: isMobile
              ? theme.palette.background.paper
              : "transparent",
            borderRadius: isMobile ? "24px 24px 0 0" : 0,
            position: "relative",
          }}
        >
          <Typography
            variant="h5"
            fontWeight={theme.typography.fontWeightSemiBold}
            mb={4}
            align="center"
          >
            Acesse sua conta
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="E-mail"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.autofill} inset`,
                        WebkitTextFillColor: theme.palette.text.primary,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              showPassword ? "Ocultar senha" : "Mostrar senha"
                            }
                            onClick={() => setShowPassword((p) => !p)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.autofill} inset`,
                        WebkitTextFillColor: theme.palette.text.primary,
                      },
                    }}
                  />
                )}
              />
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              endIcon={loading && <CircularProgress size={20} />}
              sx={{ mt: 3 }}
            >
              Entrar
            </Button>
          </form>
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/signup")}
              sx={{
                cursor: "pointer",
                fontWeight: theme.typography.fontWeightSemiBold,
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Cadastre-se
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
