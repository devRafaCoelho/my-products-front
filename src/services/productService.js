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

const createProductsBatch = async (productsArray, token) => {
  try {
    // Garante que é um array
    if (!Array.isArray(productsArray)) {
      throw new Error("productsArray deve ser um array");
    }

    // Verifica se o array não está vazio
    if (productsArray.length === 0) {
      throw new Error("Array de produtos não pode estar vazio");
    }

    // Valida e limpa cada produto antes de enviar
    const validatedProducts = productsArray.map((product) => {
      const validated = {
        name: String(product.name || "").trim(),
        description: String(product.description || "").trim() || "",
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock, 10) || 0,
      };

      // Validações básicas
      if (!validated.name || validated.name.length === 0) {
        throw new Error("Nome do produto é obrigatório");
      }
      if (validated.price < 0) {
        throw new Error("Preço não pode ser negativo");
      }
      if (validated.stock < 0) {
        throw new Error("Estoque não pode ser negativo");
      }

      // Adiciona expiration_date apenas se existir e for válido
      if (product.expiration_date) {
        let dateValue = null;
        
        // Se for um objeto dayjs
        if (product.expiration_date.format) {
          dateValue = product.expiration_date.format("YYYY-MM-DD");
        } 
        // Se for string
        else if (typeof product.expiration_date === "string" && product.expiration_date.trim()) {
          dateValue = product.expiration_date.trim();
        }
        // Se for Date
        else if (product.expiration_date instanceof Date) {
          dateValue = product.expiration_date.toISOString().split("T")[0];
        }

        if (dateValue) {
          validated.expiration_date = dateValue;
        }
      }

      // Adiciona id_category apenas se existir e for válido (número)
      if (product.id_category !== null && product.id_category !== undefined) {
        const categoryId = typeof product.id_category === "string" 
          ? parseInt(product.id_category, 10) 
          : product.id_category;
        
        if (!isNaN(categoryId) && categoryId > 0) {
          validated.id_category = categoryId;
        }
      }

      return validated;
    });

    // Log para debug
    console.log("Enviando produtos para API:", {
      quantidade: validatedProducts.length,
      primeiroProduto: validatedProducts[0],
      formato: Array.isArray(validatedProducts) ? "array" : typeof validatedProducts,
    });

    // Envia como array direto (o backend já aceita arrays)
    const response = await axios.post(
      `${API_URL}/api/products`,
      validatedProducts,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar produtos em lote:", error);
    console.error("Resposta do erro:", error.response?.data);
    console.error("Status:", error.response?.status);
    console.error("Dados enviados (primeiros 2):", productsArray.slice(0, 2));
    
    throw error.response?.data || { message: "Erro ao criar produtos" };
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

    // Suporta múltiplas categorias
    if (queryParams.id_category) {
      if (Array.isArray(queryParams.id_category)) {
        // Envia como string separada por vírgula
        params.append("id_category", queryParams.id_category.join(","));
      } else {
        params.append("id_category", queryParams.id_category);
      }
    }

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
  createProductsBatch,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
