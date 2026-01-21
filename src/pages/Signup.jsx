import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { UserSchema } from "../schemas/UserSchema";
import userService from "../services/userService";
import {
  Box,
  Button,
  Typography,
  TextField,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  Paper,
  CircularProgress,
  Alert,
  Link,
} from "@mui/material";
import CpfInput from "../components/inputs/CpfInput";
import PhoneInput from "../components/inputs/PhoneInput";
import { useTheme } from "@mui/material/styles";

const steps = ["Dados Pessoais", "Contato", "Senha"];

function Signup() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: yupResolver(UserSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await userService.registerUser(data);
      setSuccess("Usuário cadastrado com sucesso!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err?.message || "Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    let valid = false;
    if (activeStep === 0) {
      valid = await trigger(["firstName", "lastName"]);
    } else if (activeStep === 1) {
      valid = await trigger(["email", "cpf", "phone"]);
    } else if (activeStep === 2) {
      valid = await trigger(["password"]);
    }
    if (valid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
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
              background: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Estoque Inteligente
            </Typography>
            <Typography variant="h6" gutterBottom>
              Controle os produtos da sua casa
            </Typography>
            <Typography variant="body1">
              Cadastre-se para gerenciar o estoque doméstico e tenha mais
              praticidade no dia a dia.
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
              fontWeight={700}
              gutterBottom
              align="center"
            >
              Estoque Inteligente
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 1 }}>
              Controle os produtos da sua casa
            </Typography>
            <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
              Cadastre-se e comece a gerenciar seu estoque doméstico
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
          <Typography variant="h5" fontWeight={600} mb={2} align="center">
            Cadastro de Usuário
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeStep === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sobrenome"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Box>
            )}
            {activeStep === 1 && (
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
                    />
                  )}
                />
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <CpfInput
                      name="cpf"
                      label="CPF"
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.cpf?.message}
                    />
                  )}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      name="phone"
                      label="Telefone"
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.phone?.message}
                    />
                  )}
                />
              </Box>
            )}
            {activeStep === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Senha"
                      type="password"
                      fullWidth
                      error={!!errors.password && touchedFields.password}
                      helperText={
                        touchedFields.password ? errors.password?.message : ""
                      }
                    />
                  )}
                />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Voltar
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="contained">
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={loading && <CircularProgress size={20} />}
                >
                  Cadastrar
                </Button>
              )}
            </Box>
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
              Já tem uma conta?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/login")}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Faça login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default Signup;
