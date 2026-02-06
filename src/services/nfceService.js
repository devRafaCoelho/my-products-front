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
    // SEFAZ Bahia: http://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_danfe.aspx?p=...
    const url = new URL(qrCodeUrl);
    const params = url.searchParams.get("p");
    
    if (!params) {
      throw new Error("URL do QR Code inválida - parâmetro 'p' não encontrado");
    }

    // Os parâmetros vêm separados por |
    const parts = params.split("|");
    
    if (parts.length < 4) {
      throw new Error(`Formato de QR Code inválido - esperado pelo menos 4 partes, encontrado ${parts.length}`);
    }

    return {
      chave: parts[0], // Chave de acesso da nota (44 dígitos)
      versao: parts[1],
      ambiente: parts[2],
      // Outros parâmetros podem estar presentes
      fullParams: params, // Mantém os parâmetros completos para reconstruir URL
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
    // Normaliza a URL se necessário
    let urlToUse = qrCodeUrl;
    if (!urlToUse.match(/^https?:\/\//i)) {
      urlToUse = `https://${urlToUse}`;
    }
    
    console.log("Consultando NFCe na URL:", urlToUse);
    
    // Extrai os parâmetros da URL
    const nfceParams = parseNFCeUrl(urlToUse);
    console.log("Parâmetros extraídos:", nfceParams);
    
    // Tenta consultar diretamente na SEFAZ
    // Nota: A SEFAZ pode ter CORS bloqueado, então pode ser necessário usar um proxy/backend
    try {
      // Primeira tentativa: consulta direta (pode falhar por CORS)
      const response = await axios.get(urlToUse, {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Aceita redirects
        },
      });

      // Processa o HTML/XML retornado
      console.log("Resposta recebida da SEFAZ, tamanho:", response.data?.length || 0);
      console.log("URL final após redirects:", response.request?.responseURL || urlToUse);
      
      // Verifica se recebeu página sintética (Bahia) e tenta obter DANFE completa
      const htmlContent = response.data;
      if (htmlContent.includes("Sintetico") || htmlContent.includes("sintético")) {
        console.log("Página sintética detectada, tentando obter DANFE completa...");
        
        // Tenta construir URL da DANFE completa para Bahia
        if (urlToUse.includes("sefaz.ba.gov.br")) {
          const danfeUrl = `http://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_danfe.aspx?p=${nfceParams.fullParams}`;
          console.log("Tentando acessar DANFE completa:", danfeUrl);
          
          try {
            const danfeResponse = await axios.get(danfeUrl, {
              headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
              timeout: 20000,
            });
            console.log("DANFE completa obtida, tamanho:", danfeResponse.data?.length || 0);
            return parseNFCeResponse(danfeResponse.data);
          } catch (danfeError) {
            console.warn("Não foi possível obter DANFE completa, usando página sintética:", danfeError.message);
            // Continua com a página sintética
          }
        }
      }
      
      return parseNFCeResponse(htmlContent);
    } catch (error) {
      console.error("Erro na consulta:", error);
      
      // Se falhar por CORS, tenta usar a API do backend (se disponível)
      // Ou retorna erro informando que precisa de proxy
      if (error.code === "ERR_NETWORK" || error.message?.includes("CORS")) {
        throw new Error(
          "Não foi possível consultar a nota fiscal diretamente devido a restrições de CORS. " +
          "É necessário usar um serviço backend para fazer a consulta na SEFAZ."
        );
      }
      
      throw error;
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
const parseNFCeResponse = (htmlContent) => {
  const products = [];
  
  try {
    // Cria um parser de HTML temporário
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    
    // Verifica se é página sintética (sem produtos visíveis)
    const isSynthetic = htmlContent.includes("Sintetico") || 
                        htmlContent.includes("sintético") ||
                        doc.querySelector("body")?.textContent?.includes("Sintetico");
    
    if (isSynthetic) {
      console.warn("Página sintética detectada - produtos não estão disponíveis nesta visualização");
      // Tenta extrair informações básicas mesmo assim
      return parseProductsFromText(htmlContent);
    }
    
    // Tenta encontrar a tabela de produtos na página da SEFAZ
    // O formato pode variar entre estados, então tentamos múltiplos seletores
    // Para Bahia, pode estar em tabelas específicas
    const productRows = doc.querySelectorAll(
      "table tr, .produto, .item-produto, [class*='produto'], [class*='item'], " +
      "[id*='produto'], [id*='item'], .linhaProduto, tr[class*='Item']"
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
 * @param {string} token - Token de autenticação
 * @returns {Promise<Array>} Array de produtos
 */
export const consultNFCeViaBackend = async (qrCodeUrl, backendUrl, token) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/nfce/consult`,
      {
        qrCodeUrl: qrCodeUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Verifica se a resposta tem produtos (mesmo que vazio)
    if (response.data) {
      // Se tem produtos no array (mesmo que vazio), é uma resposta válida
      if (Array.isArray(response.data.products)) {
        return response.data.products;
      }
      // Se não tem produtos mas tem mensagem, pode ser que não encontrou produtos
      if (response.data.message && response.status === 404) {
        // Backend retornou 404 mas com mensagem - provavelmente não encontrou produtos
        return []; // Retorna array vazio para ser tratado pelo componente
      }
    }

    throw new Error("Resposta do backend inválida");
  } catch (error) {
    console.error("Erro ao consultar via backend:", error);
    
    // Trata erros específicos
    if (error.response) {
      // Erro com resposta do servidor
      if (error.response.status === 404) {
        // Verifica se é 404 de produtos não encontrados ou rota não encontrada
        const errorMessage = error.response?.data?.message || "";
        if (errorMessage.includes("produto") || errorMessage.includes("Nenhum")) {
          // É 404 de produtos não encontrados - retorna array vazio
          return [];
        }
        // É 404 de rota não encontrada
        throw new Error(
          "Rota não encontrada no backend. Verifique se a rota /api/nfce/consult está registrada corretamente."
        );
      }
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error("Não autorizado. Verifique seu token de autenticação.");
      }
      throw new Error(
        error.response?.data?.message ||
          `Erro no servidor (${error.response.status}): ${error.response.statusText}`
      );
    } else if (error.request) {
      // Requisição feita mas sem resposta
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
      );
    } else {
      // Erro ao configurar a requisição
      throw new Error(
        error.message || "Erro ao consultar nota fiscal no servidor"
      );
    }
  }
};
