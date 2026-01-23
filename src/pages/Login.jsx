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
  useMediaQuery,
  Paper,
  CircularProgress,
  Alert,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function Login() {
  const navigate = useNavigate();
  const { setUserData } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        background: isMobile
          ? theme.palette.background.default
          : `linear-gradient(90deg, #42a5f5 50%, ${theme.palette.background.default} 50%)`,
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
              background: "#42a5f5",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Bem-vindo de volta!
            </Typography>
            <Typography variant="h6" gutterBottom>
              Acesse sua conta
            </Typography>
            <Typography variant="body1">
              Gerencie seu estoque doméstico com praticidade e organize os
              produtos da sua casa.
            </Typography>
          </Box>
        )}
        {isMobile && (
          <Box
            sx={{
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              color: "#fff",
              py: 8,
              px: 4,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              gutterBottom
              align="center"
            >
              Estoque Inteligente
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 1 }}>
              Acesse sua conta
            </Typography>
            <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
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
          <Typography variant="h5" fontWeight={600} mb={4} align="center">
            Login
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
                        WebkitBoxShadow: `0 0 0 100px ${theme.palette.mode === "dark" ? "#2d2d2d" : "#e3f2fd"} inset`,
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
                    type="password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{
                      "& input:-webkit-autofill": {
                        WebkitBoxShadow: `0 0 0 100px ${theme.palette.mode === "dark" ? "#2d2d2d" : "#e3f2fd"} inset`,
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
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/signup")}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Cadastre-se
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
