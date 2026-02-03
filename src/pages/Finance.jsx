import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  useTheme,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { BarChart } from "@mui/x-charts/BarChart";
import { AppContext } from "../contexts/AppContext";
import productService from "../services/productService";

const MONTHS_FOR_AVG_AND_CHART = 12;
const MONTH_NAMES_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function Finance() {
  const { userData } = useContext(AppContext);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const chartContainerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setChartWidth(width);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userData?.token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getAllProducts(userData.token, {
          limit: 1000,
        });
        setProducts(response.data || []);
      } catch (err) {
        setError(err?.message || "Erro ao carregar dados financeiros");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [userData?.token]);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value ?? 0);
  };

  const { totalThisMonth, avgMonthly, totalStockValue, chartData } =
    useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const valueByMonthMap = {};
      for (let i = MONTHS_FOR_AVG_AND_CHART - 1; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        valueByMonthMap[key] = 0;
      }

      products.forEach((p) => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        valueByMonthMap[key] =
          (valueByMonthMap[key] ?? 0) + (p.price ?? 0) * (p.stock ?? 0);
      });

      const sortedKeys = Object.keys(valueByMonthMap).sort();
      const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}`;
      const totalThisMonth = valueByMonthMap[currentKey] ?? 0;

      const sumForAvg = sortedKeys.reduce(
        (s, k) => s + (valueByMonthMap[k] ?? 0),
        0
      );
      const avgMonthly =
        sortedKeys.length > 0 ? sumForAvg / sortedKeys.length : 0;

      const totalStockValue = products.reduce(
        (sum, p) => sum + (p.price ?? 0) * (p.stock ?? 0),
        0
      );

      const chartData = sortedKeys.map((key) => {
        const [y, m] = key.split("-").map(Number);
        const label = `${MONTH_NAMES_PT[m - 1]}/${String(y).slice(-2)}`;
        return { month: label, value: valueByMonthMap[key] ?? 0, fullKey: key };
      });

      return {
        totalThisMonth,
        avgMonthly,
        totalStockValue,
        chartData,
      };
    }, [products]);

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, []);

  const planningMessage = useMemo(() => {
    if (avgMonthly === 0 && totalThisMonth === 0) {
      return "Cadastre produtos para acompanhar seus gastos mensais e usar esta visão para planejar os próximos meses.";
    }
    const parts = [];
    if (totalThisMonth > avgMonthly) {
      parts.push(
        `Este mês você já adicionou mais que sua média mensal (${formatPrice(
          avgMonthly
        )}).`
      );
    } else if (totalThisMonth < avgMonthly) {
      parts.push(
        `Este mês você está abaixo da média mensal (${formatPrice(
          avgMonthly
        )}).`
      );
    } else {
      parts.push(
        `Este mês você está na média mensal (${formatPrice(avgMonthly)}).`
      );
    }
    parts.push(
      `Use sua média de ${formatPrice(
        avgMonthly
      )}/mês como referência para os próximos meses.`
    );
    return parts.join(" ");
  }, [totalThisMonth, avgMonthly]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Finanças
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acompanhe o valor dos produtos adicionados e planeje seus gastos
        </Typography>
      </Box>

      {products.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhum produto cadastrado. Os indicadores financeiros aparecerão aqui
          quando você adicionar produtos.
        </Alert>
      )}

      {/* Cards de resumo */}
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        sx={{ mb: 4, width: "100%", boxSizing: "border-box" }}
      >
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          sx={{
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Card
            elevation={2}
            sx={{
              width: "100%",
              height: "100%",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <CalendarIcon fontSize="large" />
                <Typography variant="overline">
                  Valor adicionado este mês
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(totalThisMonth)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Produtos cadastrados em {currentMonthLabel}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          sx={{
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Card
            elevation={2}
            sx={{
              width: { xs: "100%" },
              minWidth: 0,
              height: "100%",
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TrendingUpIcon fontSize="large" />
                <Typography variant="overline">
                  Média de gasto mensal
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatPrice(avgMonthly)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Média dos últimos {MONTHS_FOR_AVG_AND_CHART} meses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          sx={{
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Card
            elevation={2}
            sx={{ width: { xs: "100%" }, minWidth: 0, height: "100%" }}
          >
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <MoneyIcon color="primary" fontSize="large" />
                <Typography variant="overline" color="text.secondary">
                  Valor total em estoque
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatPrice(totalStockValue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor atual do estoque
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico comparativo */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <InventoryIcon color="primary" />
          Comparativo mensal
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Valor dos produtos cadastrados por mês (últimos{" "}
          {MONTHS_FOR_AVG_AND_CHART} meses)
        </Typography>
        <Box
          ref={chartContainerRef}
          sx={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            height: 320,
            overflow: "hidden",
          }}
        >
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: chartData.map((d) => d.month),
                tickLabelStyle: { fontSize: 12 },
                tickLabelPlacement: "middle",
              },
            ]}
            series={[
              {
                data: chartData.map((d) => d.value),
                label: "Valor",
                color: theme.palette.primary.main,
              },
            ]}
            width={Math.max(chartWidth, 300)}
            height={320}
            margin={{ top: 24, right: 24, bottom: 36, left: 56 }}
            borderRadius={6}
            slotProps={{
              legend: { hidden: true },
              tooltip: {
                valueFormatter: (value) => formatPrice(value),
              },
            }}
            sx={{
              "& .MuiChartsAxis-tick": { fill: theme.palette.text.secondary },
              "& .MuiChartsAxis-line": {
                stroke: theme.palette.divider,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Planejamento */}
      <Paper elevation={2} sx={{ p: 3, width: "100%", minWidth: 0 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <MoneyIcon color="primary" />
          Planejamento
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {planningMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Acompanhe os gastos por mês para identificar tendências e se planejar
          melhor.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Finance;
