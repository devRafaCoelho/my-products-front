import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAllCategories = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao buscar categorias" };
  }
};

const getCategoryById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao buscar categoria" };
  }
};

export default {
  getAllCategories,
  getCategoryById,
};
