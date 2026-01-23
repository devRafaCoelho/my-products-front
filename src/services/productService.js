import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const createProduct = async (productData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/products`, productData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao criar produto" };
  }
};

const getAllProducts = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao buscar produtos" };
  }
};

const getProductById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao buscar produto" };
  }
};

const updateProduct = async (id, data, token) => {
  try {
    const response = await axios.put(`${API_URL}/api/products/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao atualizar produto" };
  }
};

const deleteProduct = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/api/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erro ao deletar produto" };
  }
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
