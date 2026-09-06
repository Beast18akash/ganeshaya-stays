import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "./AuthContext";
import { roomsDummyData } from "../assets/assets";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [searchedCities, setSearchedCities] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showHotelReg, setShowHotelReg] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/rooms");
      const data = response.data;
      if (data.success) {
        setRooms(data.rooms?.length ? data.rooms : roomsDummyData);
      } else {
        setRooms(roomsDummyData);
        toast.error(data.message);
      }
    } catch (error) {
      setRooms(roomsDummyData);
      toast.error(error.response?.data?.message || "Unable to fetch rooms.");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    setIsOwner(user?.role === "hotelOwner");
  }, [user]);

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
        setIsOwner,
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
