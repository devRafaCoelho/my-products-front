import axios from "axios";

/**
 * Extrai os parâmetros da URL do QR Code da nota fiscal
 * @param {string} qrCodeUrl - URL do QR Code da nota fiscal
 * @returns {Object} Objeto com os parâmetros da nota (chave, nNF, etc)
 */
const parseNFCeUrl = (qrCodeUrl) => {
  try {
    // Formato comum: https://www.sefaz.ce.gov.br/nfce/consulta?p=CHAVE|VERSAO|AMBIENTE|...
    // Ou: http://www.nfce.sefaz.ce.gov.br/nfce/consulta?p=...
    const url = new URL(qrCodeUrl);
    const params = url.searchParams.get("p");
    
    if (!params) {
      throw new Error("URL do QR Code inválida");
    }

    // Os parâmetros vêm separados por |
    const parts = params.split("|");
    
    if (parts.length < 4) {
      throw new Error("Formato de QR Code inválido");
    }

    return {
      chave: parts[0], // Chave de acesso da nota (44 dígitos)
      versao: parts[1],
      ambiente: parts[2],
      // Outros parâmetros podem estar presentes
    };
  } catch (error) {
    throw new Error("Erro ao processar URL do QR Code: " + error.message);
  }
};

/**
 * Consulta a nota fiscal na SEFAZ usando a URL do QR Code
 * @param {string} qrCodeUrl - URL do QR Code escaneado
 * @returns {Promise<Array>} Array de produtos extraídos da nota
 */
export const consultNFCe = async (qrCodeUrl) => {
  try {
    // Extrai os parâmetros da URL
    const nfceParams = parseNFCeUrl(qrCodeUrl);
    
    // Tenta consultar diretamente na SEFAZ
    // Nota: A SEFAZ pode ter CORS bloqueado, então pode ser necessário usar um proxy/backend
    try {
      // Primeira tentativa: consulta direta (pode falhar por CORS)
      const response = await axios.get(qrCodeUrl, {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 10000,
      });

      // Processa o HTML/XML retornado
      return parseNFCeResponse(response.data, nfceParams);
    } catch (corsError) {
      // Se falhar por CORS, tenta usar a API do backend (se disponível)
      // Ou retorna erro informando que precisa de proxy
      throw new Error(
        "Não foi possível consultar a nota fiscal diretamente. " +
        "É necessário usar um serviço backend para fazer a consulta na SEFAZ devido a restrições de CORS."
      );
    }
  } catch (error) {
    console.error("Erro ao consultar NFCe:", error);
    throw error;
  }
};

/**
 * Processa a resposta HTML/XML da SEFAZ e extrai os produtos
 * @param {string} htmlContent - Conteúdo HTML/XML retornado pela SEFAZ
 * @param {Object} params - Parâmetros da nota fiscal
 * @returns {Array} Array de produtos extraídos
 */
const parseNFCeResponse = (htmlContent, params) => {
  const products = [];
  
  try {
    // Cria um parser de HTML temporário
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    
    // Tenta encontrar a tabela de produtos na página da SEFAZ
    // O formato pode variar entre estados, então tentamos múltiplos seletores
    const productRows = doc.querySelectorAll(
      "table tr, .produto, .item-produto, [class*='produto'], [class*='item']"
    );

    if (productRows.length === 0) {
      // Se não encontrar na estrutura HTML, tenta extrair do texto
      return parseProductsFromText(htmlContent);
    }

    productRows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
      if (cells.length < 3) return; // Linha muito curta, provavelmente não é produto

      const textContent = row.textContent || "";
      
      // Ignora cabeçalhos e rodapés
      if (
        textContent.match(/descri|produto|valor|total|subtotal|imposto/i) &&
        !textContent.match(/\d+[.,]\d{2}/)
      ) {
        return;
      }

      // Tenta extrair informações do produto
      const priceMatch = textContent.match(/R\$\s*(\d+[.,]\d{2})/);
      const quantityMatch = textContent.match(/(\d+)\s*(?:x|un|unid|kg|g|ml|l)/i);

      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(",", "."));
        const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
        
        // Remove números e símbolos para obter o nome
        const name = textContent
          .replace(/R\$\s*\d+[.,]\d{2}/g, "")
          .replace(/\d+\s*(?:x|un|unid|kg|g|ml|l)/gi, "")
          .replace(/\d+/g, "")
          .trim()
          .substring(0, 100);

        if (name.length > 2 && price > 0) {
          products.push({
            name: name || "Produto sem nome",
            description: "",
            price: price,
            stock: quantity,
            expiration_date: null,
            category: "Outros",
          });
        }
      }
    });

    // Se não encontrou produtos na estrutura HTML, tenta parsear do texto
    if (products.length === 0) {
      return parseProductsFromText(htmlContent);
    }

    return products;
  } catch (error) {
    console.error("Erro ao processar resposta da SEFAZ:", error);
    // Fallback: tenta extrair do texto puro
    return parseProductsFromText(htmlContent);
  }
};

/**
 * Extrai produtos do texto HTML quando a estrutura não está clara
 * @param {string} htmlContent - Conteúdo HTML
 * @returns {Array} Array de produtos
 */
const parseProductsFromText = (htmlContent) => {
  const products = [];
  
  // Remove tags HTML e extrai texto
  const text = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Divide em linhas e processa
  const lines = text.split("\n").filter((line) => line.trim().length > 10);

  let currentProduct = null;
  const pricePattern = /R\$\s*(\d+[.,]\d{2})/;
  const quantityPattern = /(\d+)\s*(?:x|un|unid|kg|g|ml|l)/i;

  for (const line of lines) {
    // Ignora linhas de cabeçalho/rodapé
    if (
      line.match(/total|subtotal|desconto|imposto|cnpj|cpf|nota fiscal|chave/i)
    ) {
      continue;
    }

    const priceMatch = line.match(pricePattern);
    if (priceMatch && currentProduct) {
      // Finaliza produto anterior
      products.push(currentProduct);
      currentProduct = null;
    }

    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", "."));
      const quantityMatch = line.match(quantityPattern);
      const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

      const name = line
        .replace(pricePattern, "")
        .replace(quantityPattern, "")
        .trim()
        .substring(0, 100);

      if (name.length > 2) {
        currentProduct = {
          name: name,
          description: "",
          price: price,
          stock: quantity,
          expiration_date: null,
          category: "Outros",
        };
      }
    } else if (currentProduct && line.length > 5) {
      // Continuação da descrição
      currentProduct.description +=
        (currentProduct.description ? " " : "") + line.trim();
    }
  }

  if (currentProduct) {
    products.push(currentProduct);
  }

  return products;
};

/**
 * Consulta a nota fiscal usando um serviço backend (recomendado)
 * @param {string} qrCodeUrl - URL do QR Code
 * @param {string} backendUrl - URL do backend que fará a consulta na SEFAZ
 * @returns {Promise<Array>} Array de produtos
 */
export const consultNFCeViaBackend = async (qrCodeUrl, backendUrl) => {
  try {
    const response = await axios.post(`${backendUrl}/api/nfce/consult`, {
      qrCodeUrl: qrCodeUrl,
    });

    if (response.data && response.data.products) {
      return response.data.products;
    }

    throw new Error("Resposta do backend inválida");
  } catch (error) {
    console.error("Erro ao consultar via backend:", error);
    throw new Error(
      error.response?.data?.message ||
        "Erro ao consultar nota fiscal no servidor"
    );
  }
};
