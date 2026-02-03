import React, { createContext, useState, useMemo } from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { getItem, setItem } from "../utils/storage";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode = getItem("themeMode");
    return savedMode || "light";
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "light" ? "dark" : "light";
      setItem("themeMode", newMode);
      return newMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
          background: {
            autofill: mode === "dark" ? "#2d2d2d" : "#e3f2fd",
          },
        },
        typography: {
          fontFamily: "Nunito",
          fontWeightSemiBold: 600,
          fontWeightBold: 700,
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
