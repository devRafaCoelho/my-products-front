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
  TextField,
  Divider,
  DialogContentText,
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
import { consultNFCeViaBackend } from "../services/nfceService";
import { getItem } from "../utils/storage";

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
  const [manualUrl, setManualUrl] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);

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
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Usa 80% da área visível para melhor detecção
            const minEdgePercentage = 0.8;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "environment",
            focusMode: "continuous",
          },
        },
        (decodedText) => {
          // QR Code escaneado com sucesso
          console.log("QR Code detectado:", decodedText);
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

  const handleScanFromImage = async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    let html5QrCodeInstance = null;
    const tempElementId = `temp-qr-scanner-${Date.now()}`;

    try {
      // Cria um elemento temporário para o scanner (necessário para html5-qrcode)
      const tempElement = document.createElement("div");
      tempElement.id = tempElementId;
      tempElement.style.position = "fixed";
      tempElement.style.top = "-9999px";
      tempElement.style.left = "-9999px";
      tempElement.style.width = "1px";
      tempElement.style.height = "1px";
      tempElement.style.visibility = "hidden";
      document.body.appendChild(tempElement);

      // Aguarda o elemento ser adicionado ao DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cria instância do scanner
      html5QrCodeInstance = new Html5Qrcode(tempElementId);
      
      // Escaneia o arquivo
      const decodedText = await html5QrCodeInstance.scanFile(file, true);
      
      // Limpa a instância
      try {
        await html5QrCodeInstance.clear();
      } catch (clearError) {
        // Ignora erros ao limpar
        console.debug("Erro ao limpar scanner:", clearError);
      }
      
      // Remove o elemento temporário
      if (tempElement && tempElement.parentNode) {
        tempElement.parentNode.removeChild(tempElement);
      }
      
      if (decodedText) {
        await handleQRCodeScanned(decodedText);
      } else {
        throw new Error("QR Code não encontrado na imagem");
      }
    } catch (err) {
      console.error("Erro ao escanear imagem:", err);
      
      // Limpa recursos em caso de erro
      try {
        if (html5QrCodeInstance) {
          await html5QrCodeInstance.clear();
        }
      } catch {
        // Ignora erros ao limpar
      }
      
      const tempElement = document.getElementById(tempElementId);
      if (tempElement && tempElement.parentNode) {
        tempElement.parentNode.removeChild(tempElement);
      }
      
      setError(
        err.message?.includes("not found") || err.message?.includes("undefined")
          ? "Erro ao processar a imagem. Tente novamente com outra imagem."
          : err.message || "Não foi possível ler o QR Code da imagem. Verifique se a imagem está nítida e contém um QR Code válido."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualUrlSubmit = () => {
    if (!manualUrl.trim()) {
      setError("Por favor, insira uma URL válida");
      return;
    }
    handleQRCodeScanned(manualUrl.trim());
  };

  const handleQRCodeScanned = async (qrCodeUrl) => {
    console.log("URL capturada do QR Code:", qrCodeUrl);
    
    // Normaliza a URL - adiciona protocolo se não tiver
    let normalizedUrl = qrCodeUrl.trim();
    
    // Se não começar com http:// ou https://, adiciona https://
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    console.log("URL normalizada:", normalizedUrl);
    
    // Verifica se é uma URL de nota fiscal
    if (
      !normalizedUrl.includes("sefaz") &&
      !normalizedUrl.includes("nfce") &&
      !normalizedUrl.includes("nfe")
    ) {
      setError("QR Code não é de uma nota fiscal válida. URL capturada: " + normalizedUrl);
      return;
    }

    // Verifica se a URL tem parâmetros (query string)
    try {
      const urlObj = new URL(normalizedUrl);
      const hasParams = urlObj.searchParams.toString().length > 0 || urlObj.search.length > 0;
      
      if (!hasParams) {
        setError(
          "URL do QR Code parece estar incompleta (sem parâmetros). " +
          "Certifique-se de que o QR Code foi escaneado completamente. " +
          `URL capturada: ${normalizedUrl}`
        );
        return;
      }
    } catch (urlError) {
      console.error("Erro ao validar URL:", urlError);
      setError("URL do QR Code inválida: " + normalizedUrl);
      return;
    }

    setQrCodeScanned(true);
    setScannedUrl(normalizedUrl);
    await handleStopQRScanner();

    // Processa a nota fiscal
    setLoading(true);
    setError(null);

    try {
      // Tenta consultar via backend primeiro (se disponível)
      const API_URL = import.meta.env.VITE_API_URL;
      const userData = JSON.parse(getItem("user") || "{}");
      const token = userData?.token;
      let products = [];

      try {
        // Tenta usar backend se disponível e se tiver token
        if (token && API_URL) {
          products = await consultNFCeViaBackend(normalizedUrl, API_URL, token);
        } else {
          throw new Error("Token ou API_URL não disponível");
        }
      } catch (backendError) {
        // Verifica se é erro 404 (rota não encontrada)
        if (backendError.message?.includes("404") || backendError.message?.includes("não encontrada")) {
          // Não tenta consulta direta se a rota não existe
          throw new Error(
            "A rota de consulta NFCe não está disponível no backend. " +
            "Por favor, verifique se a rota /api/nfce/consult foi criada e registrada corretamente. " +
            `Erro: ${backendError.message}`
          );
        }
        
        // Se for outro erro do backend, também não tenta consulta direta (vai falhar por CORS)
        if (backendError.message?.includes("servidor") || backendError.message?.includes("conectar")) {
          throw new Error(
            `Erro ao conectar com o backend: ${backendError.message}. ` +
            "Verifique se o servidor está rodando e acessível."
          );
        }
        
        // Se for erro de autenticação, não tenta consulta direta
        if (backendError.message?.includes("autorizado") || backendError.message?.includes("token")) {
          throw backendError;
        }
        
        // Para outros erros, mostra mensagem específica
        throw backendError;
      }

      if (products.length === 0) {
        throw new Error("Nenhum produto encontrado na nota fiscal");
      }

      // Para o loading primeiro
      setLoading(false);
      
      // Aguarda um momento para garantir que o estado seja atualizado
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Abre diálogo de confirmação antes de mostrar a revisão
      // Não fecha o diálogo principal ainda - só fecha quando confirmar ou cancelar
      setPendingProducts(products);
      setConfirmDialogOpen(true);
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
      
      if (products.length === 0) {
        throw new Error("Nenhum produto encontrado na nota fiscal");
      }

      // Para o loading primeiro
      setLoading(false);
      
      // Aguarda um momento para garantir que o estado seja atualizado
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Abre diálogo de confirmação antes de mostrar a revisão
      // Não fecha o diálogo principal ainda - só fecha quando confirmar ou cancelar
      setPendingProducts(products);
      setConfirmDialogOpen(true);
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
    setManualUrl("");
    setConfirmDialogOpen(false);
    setPendingProducts([]);
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
    <>
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
                    gap: 3,
                    py: 2,
                  }}
                >
                  {/* Opção 1: Upload de imagem (RECOMENDADO para navegador web) */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      📷 Escanear de uma imagem (Recomendado)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tire uma foto do QR Code com seu celular e envie aqui, ou salve a imagem do QR Code e faça upload
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleScanFromImage(file);
                          }
                        };
                        input.click();
                      }}
                      disabled={loading}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Selecionar Imagem do QR Code
                    </Button>
                  </Box>

                  <Divider>ou</Divider>

                  {/* Opção 2: URL manual */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      🔗 Colar URL do QR Code
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Se você já escaneou o QR Code com outro app, copie a URL completa e cole aqui
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Cole aqui a URL completa do QR Code (ex: https://nfe.sefaz.ba.gov.br/...?p=...)"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        disabled={loading}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleManualUrlSubmit();
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleManualUrlSubmit}
                        disabled={!manualUrl.trim() || loading}
                      >
                        Consultar
                      </Button>
                    </Box>
                  </Box>

                  <Divider>ou</Divider>

                  {/* Opção 3: Câmera (pode não funcionar em desktop) */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      📹 Escanear com câmera
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use a webcam do seu computador ou câmera do dispositivo (pode não estar disponível em todos os navegadores)
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScannerIcon />}
                      onClick={handleStartQRScanner}
                      disabled={loading}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Iniciar Escaneamento
                    </Button>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
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

    {/* Diálogo de Confirmação - Renderizado fora do diálogo principal */}
    <Dialog
      open={confirmDialogOpen}
      onClose={() => {
        setConfirmDialogOpen(false);
        setPendingProducts([]);
        // Fecha o diálogo principal ao fechar o de confirmação
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Confirmar Produtos Extraídos</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Gostaria de adicionar os {pendingProducts.length} produto{pendingProducts.length !== 1 ? "s" : ""} na sua lista de produtos?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setConfirmDialogOpen(false);
            setPendingProducts([]);
            // Fecha o diálogo principal ao cancelar
            handleClose();
          }}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setConfirmDialogOpen(false);
            // Fecha o diálogo principal antes de abrir a revisão
            handleClose();
            // Abre a tela de revisão
            onProductsExtracted(pendingProducts);
            setPendingProducts([]);
          }}
          variant="contained"
          color="primary"
          autoFocus
        >
          Sim, adicionar produtos
        </Button>
      </DialogActions>
    </Dialog>

    {/* Diálogo de Confirmação - Renderizado fora do diálogo principal */}
    <Dialog
      open={confirmDialogOpen}
      onClose={() => {
        setConfirmDialogOpen(false);
        setPendingProducts([]);
        // Fecha o diálogo principal ao fechar o de confirmação
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Confirmar Produtos Extraídos</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Gostaria de adicionar os {pendingProducts.length} produto{pendingProducts.length !== 1 ? "s" : ""} na sua lista de produtos?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setConfirmDialogOpen(false);
            setPendingProducts([]);
            // Fecha o diálogo principal ao cancelar
            handleClose();
          }}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setConfirmDialogOpen(false);
            // Fecha o diálogo principal antes de abrir a revisão
            handleClose();
            // Abre a tela de revisão
            onProductsExtracted(pendingProducts);
            setPendingProducts([]);
          }}
          variant="contained"
          color="primary"
          autoFocus
        >
          Sim, adicionar produtos
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default ReceiptScanner;
