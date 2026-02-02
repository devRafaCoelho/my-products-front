import { useContext, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProfileSchema, NewPasswordSchema } from "../schemas/UserSchema";
import userService from "../services/userService";
import { AppContext } from "../contexts/AppContext";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
} from "@mui/material";
import PhoneInput from "../components/inputs/PhoneInput";

function Account() {
  const { userData, setUserData } = useContext(AppContext);
  const [tabValue, setTabValue] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const profileDefaultValues = {
    firstName: userData?.firstname ?? userData?.firstName ?? "",
    lastName: userData?.lastname ?? userData?.lastName ?? "",
    email: userData?.email ?? "",
    cpf: userData?.cpf ?? "",
    phone: userData?.phone ?? "",
  };

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(ProfileSchema),
    mode: "onChange",
    defaultValues: profileDefaultValues,
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: yupResolver(NewPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await userService.updateUser(
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
        userData?.token
      );
      setUserData({ ...userData, ...response, token: userData.token });
      setSuccessMessage("Dados atualizados com sucesso!");
      setSnackbarOpen(true);
    } catch (err) {
      setProfileError(err?.message || "Erro ao atualizar dados");
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await userService.updateUserPassword(
        { password: data.password, newPassword: data.newPassword },
        userData?.token
      );
      resetPasswordForm();
      setSuccessMessage("Senha alterada com sucesso!");
      setSnackbarOpen(true);
    } catch (err) {
      setPasswordError(err?.message || "Erro ao alterar senha");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!userData?.token) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Faça login para acessar sua conta.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Minha conta
      </Typography>

      <Paper elevation={2} sx={{ mt: 3, width: { xs: "100%", md: "50%" } }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => {
            setTabValue(v);
            setProfileError(null);
            setPasswordError(null);
          }}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Dados pessoais" />
          <Tab label="Segurança" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
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
                      name="firstName"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Nome"
                          fullWidth
                          variant="outlined"
                          error={!!profileErrors.firstName}
                          helperText={profileErrors.firstName?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>
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
                      name="lastName"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Sobrenome"
                          fullWidth
                          variant="outlined"
                          error={!!profileErrors.lastName}
                          helperText={profileErrors.lastName?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>
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
                      name="email"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="E-mail"
                          fullWidth
                          variant="outlined"
                          disabled
                        />
                      )}
                    />
                  </Box>
                </Grid>
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
                      name="cpf"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="CPF"
                          fullWidth
                          variant="outlined"
                          value={field.value || ""}
                          disabled
                        />
                      )}
                    />
                  </Box>
                </Grid>
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
                      name="phone"
                      control={profileControl}
                      render={({ field }) => (
                        <PhoneInput
                          name={field.name}
                          label="Telefone"
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={profileErrors.phone?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>

              {profileError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {profileError}
                </Alert>
              )}

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={profileLoading}
                  sx={{ width: "100%" }}
                  endIcon={
                    profileLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  Salvar alterações
                </Button>
              </Box>
            </form>
          )}

          {tabValue === 1 && (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <Grid
                container
                spacing={3}
                sx={{ width: "100%", boxSizing: "border-box" }}
              >
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
                      name="password"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Senha atual"
                          type="password"
                          fullWidth
                          variant="outlined"
                          autoComplete="current-password"
                          error={!!passwordErrors.password}
                          helperText={passwordErrors.password?.message}
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
                      name="newPassword"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Nova senha"
                          type="password"
                          fullWidth
                          variant="outlined"
                          autoComplete="new-password"
                          error={!!passwordErrors.newPassword}
                          helperText={passwordErrors.newPassword?.message}
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
                      name="confirmNewPassword"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Confirmar nova senha"
                          type="password"
                          fullWidth
                          variant="outlined"
                          autoComplete="new-password"
                          error={!!passwordErrors.confirmNewPassword}
                          helperText={
                            passwordErrors.confirmNewPassword?.message
                          }
                        />
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>

              {passwordError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {passwordError}
                </Alert>
              )}

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordLoading}
                  sx={{ width: "100%" }}
                  endIcon={
                    passwordLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  Alterar senha
                </Button>
              </Box>
            </form>
          )}
        </Box>
      </Paper>

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

export default Account;
