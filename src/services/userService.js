import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/api/login`, credentials);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

const updateUser = async (userData, token) => {
  try {
    const response = await axios.put(`${API_URL}/api/users`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

const updateUserPassword = async (passwordData, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/account`,
      passwordData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

const deleteUser = async (token) => {
  try {
    const response = await axios.delete(`${API_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export default {
  registerUser,
  login,
  updateUser,
  updateUserPassword,
  deleteUser,
};
