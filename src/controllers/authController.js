import * as authService from "../services/authService.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    if (result.verificationRequired) {
      return res.status(200).json({ message: result.message });
    }

    res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.verifyOtp(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { googleToken } = req.body;
    const result = await authService.googleLogin(googleToken);

    res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const result = await authService.logoutUser(req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};
