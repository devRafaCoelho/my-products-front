import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from "@mui/icons-material";
import { Html5Qrcode } from "html5-qrcode";
import { processReceiptImage } from "../services/ocrService";
import { consultNFCe, consultNFCeViaBackend } from "../services/nfceService";

function ReceiptScanner({ open, onClose, onProductsExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanMode, setScanMode] = useState("qr"); // "qr" ou "ocr"
  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [qrCodeScanned, setQrCodeScanned] = useState(false);
  const [scannedUrl, setScannedUrl] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
  };

  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        message:
          "Seu navegador não suporta acesso à câmera. Tente usar Chrome, Firefox ou Edge atualizados.",
      };
    }

    // Verifica se está em HTTPS ou localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      return {
        supported: false,
        message:
          "O acesso à câmera requer HTTPS. Se estiver em desenvolvimento, use 'http://localhost' ou configure HTTPS.",
      };
    }

    return { supported: true };
  };

  const handleStartQRScanner = async () => {
    // Limpa erros anteriores
    setError(null);

    // Verifica suporte antes de tentar
    const supportCheck = checkCameraSupport();
    if (!supportCheck.supported) {
      setError(supportCheck.message);
      return;
    }

    // Marca como ativo primeiro para renderizar o elemento
    setScannerActive(true);

    try {
      // Aguarda o React renderizar o elemento
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verifica se o elemento existe
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        setScannerActive(false);
        throw new Error("Elemento do scanner não encontrado. Tente novamente.");
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Câmera traseira
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR Code escaneado com sucesso
          handleQRCodeScanned(decodedText);
        },
        () => {
          // Ignora erros de leitura (continua tentando)
          // Não mostra erro para cada tentativa de leitura
        }
      );
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      let errorMessage = "Não foi possível acessar a câmera.";

      if (
        err.name === "NotAllowedError" ||
        err.message?.includes("permission")
      ) {
        errorMessage =
          "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador e tente novamente.";
      } else if (
        err.name === "NotFoundError" ||
        err.message?.includes("device")
      ) {
        errorMessage =
          "Nenhuma câmera encontrada. Verifique se há uma câmera conectada ao dispositivo.";
      } else if (
        err.name === "NotReadableError" ||
        err.message?.includes("busy")
      ) {
        errorMessage =
          "A câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera e tente novamente.";
      } else if (
        err.message?.includes("HTTPS") ||
        err.message?.includes("secure")
      ) {
        errorMessage =
          "O acesso à câmera requer uma conexão segura (HTTPS). Se estiver em desenvolvimento, use 'http://localhost'.";
      } else {
        errorMessage = `Erro ao acessar câmera: ${
          err.message || "Erro desconhecido"
        }`;
      }

      setError(errorMessage);
      setScannerActive(false);

      // Tenta parar o scanner caso tenha iniciado parcialmente
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // Ignora erro ao parar
        }
        html5QrCodeRef.current = null;
      }
    }
  };

  const handleStopQRScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setScannerActive(false);
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
        setScannerActive(false);
      }
    }
  };

  const handleQRCodeScanned = async (qrCodeUrl) => {
    // Verifica se é uma URL de nota fiscal
    if (
      !qrCodeUrl.includes("sefaz") &&
      !qrCodeUrl.includes("nfce") &&
      !qrCodeUrl.includes("nfe")
    ) {
      setError("QR Code não é de uma nota fiscal válida");
      return;
    }

    setQrCodeScanned(true);
    setScannedUrl(qrCodeUrl);
    await handleStopQRScanner();

    // Processa a nota fiscal
    setLoading(true);
    setError(null);

    try {
      // Tenta consultar via backend primeiro (se disponível)
      const API_URL = import.meta.env.VITE_API_URL;
      let products = [];

      try {
        // Tenta usar backend se disponível
        products = await consultNFCeViaBackend(qrCodeUrl, API_URL);
      } catch {
        // Se backend não disponível, tenta consulta direta
        console.log("Backend não disponível, tentando consulta direta...");
        products = await consultNFCe(qrCodeUrl);
      }

      if (products.length === 0) {
        throw new Error("Nenhum produto encontrado na nota fiscal");
      }

      onProductsExtracted(products);
      handleClose();
    } catch (err) {
      setError(
        err.message ||
          "Erro ao consultar nota fiscal. Verifique se o QR Code é válido."
      );
      setQrCodeScanned(false);
      setScannedUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!preview) {
      setError("Por favor, capture ou selecione uma imagem primeiro");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cria um File a partir da preview (se necessário)
      const response = await fetch(preview);
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: blob.type });

      const products = await processReceiptImage(file);
      onProductsExtracted(products);
      handleClose();
    } catch (err) {
      setError(err.message || "Erro ao processar a imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await handleStopQRScanner();
    setPreview(null);
    setQrCodeScanned(false);
    setScannedUrl(null);
    setScannerActive(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  // Limpa o scanner quando o dialog fecha
  useEffect(() => {
    if (!open) {
      handleStopQRScanner();
      setQrCodeScanned(false);
      setScannedUrl(null);
      setScannerActive(false);
    }
    return () => {
      handleStopQRScanner();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">Escanear Nota Fiscal</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs para escolher entre QR Code e OCR */}
      <Box>
        <Tabs
          value={scanMode}
          onChange={(_, newValue) => {
            setScanMode(newValue);
            handleStopQRScanner();
            setPreview(null);
            setQrCodeScanned(false);
            setScannedUrl(null);
            setError(null); // Limpa erros ao trocar de aba
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            label="Escanear QR Code"
            value="qr"
            icon={<QrCodeScannerIcon />}
            iconPosition="start"
          />
          <Tab
            label="Anexar imagem"
            value="ocr"
            icon={<PhotoCameraIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Modo QR Code */}
          {scanMode === "qr" && (
            <>
              {!scannerActive && !qrCodeScanned && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "center",
                    gap: 2,
                    py: 4,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Posicione o QR Code da nota fiscal na frente da câmera
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={handleStartQRScanner}
                    disabled={loading}
                  >
                    Iniciar Escaneamento
                  </Button>
                  {error && (
                    <Alert severity="error" sx={{ mt: 2, maxWidth: 500 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              )}

              {scannerActive && !qrCodeScanned && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}
                  <Paper
                    elevation={2}
                    sx={{
                      position: "relative",
                      width: "100%",
                      minHeight: "300px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box
                      id="qr-reader"
                      sx={{
                        width: "100%",
                        minHeight: "300px",
                      }}
                    />
                  </Paper>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" onClick={handleStopQRScanner}>
                      Parar Escaneamento
                    </Button>
                  </Box>
                </Box>
              )}

              {qrCodeScanned && scannedUrl && (
                <Alert severity="success">
                  QR Code escaneado! Consultando nota fiscal...
                </Alert>
              )}
            </>
          )}

          {/* Modo OCR */}
          {scanMode === "ocr" && (
            <>
              {!preview && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    py: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                </Box>
              )}

              {preview && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxHeight: "400px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </Paper>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Trocar Imagem
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}

          {loading && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                py: 4,
              }}
            >
              <CircularProgress sx={{ alignSelf: "flex-start" }} />
              <Typography variant="body2" color="text.secondary">
                {scanMode === "qr"
                  ? "Consultando nota fiscal na SEFAZ..."
                  : "Processando imagem e extraindo produtos..."}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {scanMode === "ocr" && (
          <Button
            onClick={handleProcessOCR}
            variant="contained"
            disabled={!preview || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Processar Nota
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ReceiptScanner;
