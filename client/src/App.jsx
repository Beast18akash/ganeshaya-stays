import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const AllRooms = lazy(() => import("./pages/AllRooms"));
const RoomDetails = lazy(() => import("./pages/RoomDetails"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Experience = lazy(() => import("./pages/Experience"));
const Layout = lazy(() => import("./pages/HotelOwner/Layout"));
const Dashboard = lazy(() => import("./pages/HotelOwner/Dashboard"));
const AddRoom = lazy(() => import("./pages/HotelOwner/AddRoom"));
const ListRoom = lazy(() => import("./pages/HotelOwner/ListRoom"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const RouteFallback = () => (
  <div className="min-h-[70vh] flex items-center justify-center text-gray-500">Loading...</div>
);

const App = () => {
  const { pathname } = useLocation();
  const isOwnerPath = pathname.includes("owner");
  const isAuthPath = pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  return (
    <div>
      {!isOwnerPath && !isAuthPath && <Navbar />}

      <div className="min-h-[70vh]">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/hotels/:id" element={<RoomDetails />} />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route path="/experience" element={<Experience />} />

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/owner"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add-room" element={<AddRoom />} />
            <Route path="list-rooms" element={<ListRoom />} />
          </Route>
          </Routes>
        </Suspense>
      </div>

      {!isOwnerPath && !isAuthPath && <Footer />}
    </div>
  );
};

export default App;
