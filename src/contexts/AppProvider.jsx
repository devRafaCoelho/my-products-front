import { useEffect, useState } from "react";
import { getItem, setItem } from "../utils/storage";
import { AppContext } from "./AppContext";

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const storedUserData = getItem("user");
    return storedUserData ? JSON.parse(storedUserData) : null;
  });

  useEffect(() => {
    if (userData) {
      setItem("user", JSON.stringify(userData));
    }
  }, [userData]);

  return (
    <AppContext.Provider value={{ userData, setUserData }}>
      {children}
    </AppContext.Provider>
  );
};
