import { createContext, useCallback, useContext, useRef, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);
const ROOMS_CACHE_KEY = "gs_rooms_cache";

const readCachedRooms = () => {
  try {
    const cachedRooms = JSON.parse(sessionStorage.getItem(ROOMS_CACHE_KEY) || "null");
    return Array.isArray(cachedRooms) ? cachedRooms : [];
  } catch {
    return [];
  }
};

const writeCachedRooms = (nextRooms) => {
  try {
    sessionStorage.setItem(ROOMS_CACHE_KEY, JSON.stringify(nextRooms));
  } catch {
    // Storage can be unavailable or full; the in-memory response remains usable.
  }
};

export const AppProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState(readCachedRooms);
  const [roomsStatus, setRoomsStatus] = useState(() => (
    rooms.length ? "loading" : "idle"
  ));
  const [roomsError, setRoomsError] = useState("");
  const [searchedCities, setSearchedCities] = useState([]);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const roomsRef = useRef(rooms);
  const roomsStatusRef = useRef(rooms.length ? "loading" : "idle");
  const roomsRequestRef = useRef(null);
  const isOwner = user?.role === "hotelOwner";

  const updateRooms = useCallback((nextRooms) => {
    setRooms((currentRooms) => {
      const resolvedRooms = typeof nextRooms === "function" ? nextRooms(currentRooms) : nextRooms;
      roomsRef.current = resolvedRooms;
      roomsStatusRef.current = "success";
      return resolvedRooms;
    });
    setRoomsStatus("success");
    setRoomsError("");
  }, []);

  const loadRooms = useCallback(async ({ force = false } = {}) => {
    if (!force && roomsStatusRef.current === "success") {
      return roomsRef.current;
    }

    if (!force && roomsRequestRef.current) {
      return roomsRequestRef.current;
    }

    roomsStatusRef.current = "loading";
    setRoomsStatus("loading");
    setRoomsError("");

    const request = api.get("/rooms")
      .then(({ data }) => {
        if (!data?.success) {
          throw new Error(data?.message || "Unable to fetch rooms.");
        }

        const nextRooms = data.rooms || [];
        roomsRef.current = nextRooms;
        roomsStatusRef.current = "success";
        setRooms(nextRooms);
        setRoomsStatus("success");
        writeCachedRooms(nextRooms);
        return nextRooms;
      })
      .catch((error) => {
        const message = error.response?.data?.message || error.message || "Unable to fetch rooms.";
        roomsStatusRef.current = "error";
        setRoomsStatus("error");
        setRoomsError(message);
        return roomsRef.current;
      })
      .finally(() => {
        roomsRequestRef.current = null;
      });

    roomsRequestRef.current = request;
    return request;
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        rooms,
        setRooms: updateRooms,
        roomsStatus,
        roomsError,
        loadRooms,
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
