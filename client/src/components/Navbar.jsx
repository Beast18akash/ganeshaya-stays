import { Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { assets } from "../assets/uiAssets";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

const HotelReg = lazy(() => import("./HotelReg"));

const BookIcon = () => (
  <span className="text-sm">📖</span>
);

const Navbar = () => {
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Hotels", path: "/rooms" },
    { name: "Experience", path: "/experience" },
    { name: "About", path: "/about" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { user, isOwner, showHotelReg, setShowHotelReg } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    const frameId = window.requestAnimationFrame(() => {
      setIsScrolled(location.pathname !== "/" || window.scrollY > 10);
    });
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
      navigate("/");
    } catch {
      // Keep the UI usable even if the logout request fails.
    }
  };

  const goTo = (path) => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate(path);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${
        isScrolled
          ? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4"
          : "py-3 md:py-5"
      }`}
    >
      <Link
        to="/"
        aria-label="Ganeshaya Stays — home"
        className="shrink-0 flex items-center transition-opacity duration-300 hover:opacity-80"
      >
        {/*
          mix-blend-mode:multiply dissolves the white webp background so the
          Ganesha illustration floats directly on any background colour.
          On the dark hero, a warm drop-shadow lifts the navy lettering just
          enough for readability — no glow, no outline, no artificial effects.
          Against the white scrolled navbar, multiply is neutral and the
          shadow disappears naturally (shadow colour ~= bg colour).
        */}
        <img
          src={assets.logo}
          alt="Ganeshaya Stays — Luxury Hotels & Suites"
          width="480"
          height="160"
          className={`h-auto mix-blend-multiply transition-all duration-500
            w-[164px] sm:w-[196px] md:w-[236px] lg:w-[314px] xl:w-[330px]
            ${isScrolled
              ? ""
              : "[filter:drop-shadow(0_1px_6px_rgba(255,248,220,0.50))_drop-shadow(0_1px_3px_rgba(0,0,0,0.18))]"
            }`}
        />
      </Link>

      <div className="hidden md:flex items-center gap-4 lg:gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`group flex flex-col gap-0.5 ${
              isScrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {link.name}
            <div
              className={`${
                isScrolled ? "bg-gray-700" : "bg-white"
              } h-0.5 w-0 group-hover:w-full transition-all duration-300`}
            />
          </Link>
        ))}

        {user && (
          <button
            onClick={() => isOwner ? navigate("/owner") : setShowHotelReg(true)}
            className={`border px-4 py-1 text-sm font-light rounded-full cursor-pointer ${
              isScrolled ? "text-black" : "text-white"
            }`}
          >
            {isOwner ? "Dashboard" : "List Your Hotel"}
          </button>
        )}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <img
          src={assets.searchIcon}
          alt="search"
          className={`${isScrolled ? "invert" : ""} h-7 transition-all duration-500`}
        />

        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isUserMenuOpen}
              aria-label="Open user menu"
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={user.profilePicture || assets.userIcon}
                alt={user.fullname || "User"}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-2 text-sm text-gray-700">
              <button
                onClick={() => goTo("/my-bookings")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <BookIcon /> My Bookings
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-red-500"
              >
                Logout
              </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className={`px-8 py-2.5 rounded-full ml-4 transition-all duration-500 ${
              isScrolled ? "text-white bg-black" : "bg-white text-black"
            }`}
          >
            Login
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 md:hidden">
        {user && (
          <img
            src={user.profilePicture || assets.userIcon}
            alt={user.fullname || "User"}
            onClick={() => setIsMenuOpen(true)}
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
          />
        )}

        <img
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          src={assets.menuIcon}
          alt="open menu"
          className={`${isScrolled ? "invert" : ""} h-4 cursor-pointer`}
        />
      </div>

      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 z-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-4 right-4"
          onClick={() => setIsMenuOpen(false)}
        >
          <img src={assets.closeIcon} alt="close menu" className="h-6" />
        </button>

        {navLinks.map((link) => (
          <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)}>
            {link.name}
          </Link>
        ))}

        {user ? (
          <>
            <button onClick={() => goTo("/my-bookings")}>My Bookings</button>
            {isOwner ? (
              <button onClick={() => goTo("/owner")}>Dashboard</button>
            ) : (
              <button onClick={() => {
                setIsMenuOpen(false);
                setShowHotelReg(true);
              }}>
                List Your Hotel
              </button>
            )}
            <button onClick={handleLogout} className="text-red-500">
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => goTo("/signin")}
            className="bg-black text-white px-8 py-2.5 rounded-full"
          >
            Login
          </button>
        )}
      </div>

      {showHotelReg && (
        <Suspense fallback={null}>
          <HotelReg onClose={() => setShowHotelReg(false)} />
        </Suspense>
      )}
    </nav>
  );
};

export default Navbar;
