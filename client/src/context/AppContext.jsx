import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [searchedCities, setSearchedCities] = useState([]);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const isOwner = user?.role === "hotelOwner";

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms");
      const data = response.data;
      if (data.success) {
        setRooms(data.rooms || []);
      } else {
        setRooms([]);
        toast.error(data.message);
      }
    } catch (error) {
      setRooms([]);
      toast.error(error.response?.data?.message || "Unable to fetch rooms.");
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchRooms();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        rooms,
        setRooms,
        searchedCities,
        setSearchedCities,
        isOwner,
        showHotelReg,
        setShowHotelReg,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
};
