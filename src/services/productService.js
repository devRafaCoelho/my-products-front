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

const getAllProducts = async (token, queryParams = {}) => {
  try {
    const params = new URLSearchParams();

    if (queryParams.page) params.append("page", queryParams.page);
    if (queryParams.limit) params.append("limit", queryParams.limit);
    if (queryParams.search) params.append("search", queryParams.search);
    if (queryParams.expiration_date)
      params.append("expiration_date", queryParams.expiration_date);
    if (queryParams.id_category)
      params.append("id_category", queryParams.id_category);

    const queryString = params.toString();
    const url = queryString
      ? `${API_URL}/api/products?${queryString}`
      : `${API_URL}/api/products`;

    const response = await axios.get(url, {
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
