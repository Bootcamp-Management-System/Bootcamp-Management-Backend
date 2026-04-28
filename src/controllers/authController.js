import * as authService from "../services/authService.js";

export const signup = async (req, res) => {
  try {
    const result = await authService.signupUser(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.verifyOtp(email, otp, newPassword);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp(email);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { googleToken } = req.body;
    const result = await authService.googleLogin(googleToken);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const result = await authService.logoutUser(req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, oldPassword, newPassword);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
