import User from "../models/user.js";

export const getUserData = async (req, res) => {
  try {
    res.json({
      success: true,
      role: req.user.role,
      recentSearchedCities: req.user.recentSearchedCities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCities } = req.body;

    if (!recentSearchedCities || typeof recentSearchedCities !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid city is required.",
      });
    }

    const user = req.user;

    if (user.recentSearchedCities.length >= 3) {
      user.recentSearchedCities.shift();
    }

    user.recentSearchedCities.push(recentSearchedCities);
    await user.save();

    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
