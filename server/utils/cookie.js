const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie("token", options);
};
