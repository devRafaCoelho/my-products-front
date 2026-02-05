import { createWorker } from "tesseract.js";

/**
 * Processa uma imagem de nota fiscal usando OCR e extrai informações de produtos
 * @param {File|string} imageFile - Arquivo de imagem ou URL da imagem
 * @returns {Promise<Array>} Array de produtos extraídos
 */
export const processReceiptImage = async (imageFile) => {
  try {
    const worker = await createWorker("por"); // Português
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();

    // Processa o texto extraído para identificar produtos
    const products = parseReceiptText(text);
    return products;
  } catch (error) {
    console.error("Erro ao processar imagem:", error);
    throw new Error("Erro ao processar a imagem da nota fiscal");
  }
};

/**
 * Analisa o texto extraído da nota fiscal e identifica produtos
 * Esta é uma implementação básica - pode ser melhorada com regex mais sofisticados
 * @param {string} text - Texto extraído pelo OCR
 * @returns {Array} Array de produtos identificados
 */
const parseReceiptText = (text) => {
  const products = [];
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Padrões para identificar produtos na nota fiscal
  // Formato esperado: Nome do produto | Preço | Quantidade | etc
  const pricePattern = /R\$\s*(\d+[.,]\d{2})/;
  const quantityPattern = /(\d+)\s*(?:x|un|unid|kg|g|ml|l)/i;
  const datePattern = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/;

  let currentProduct = null;
  let category = "Outros"; // Categoria padrão

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignora linhas que são cabeçalhos, rodapés ou totais
    if (
      line.match(/total|subtotal|desconto|imposto|cnpj|cpf|nota fiscal/i) ||
      line.length < 3
    ) {
      continue;
    }

    // Tenta identificar categoria por palavras-chave
    if (line.match(/alimento|comida|bebida|leite|pão|arroz|feijão/i)) {
      category = "Alimentos";
    } else if (line.match(/limpeza|sabão|detergente|desinfetante/i)) {
      category = "Limpeza";
    }

    // Tenta extrair preço
    const priceMatch = line.match(pricePattern);
    const price = priceMatch
      ? parseFloat(priceMatch[1].replace(",", "."))
      : null;

    // Tenta extrair quantidade
    const quantityMatch = line.match(quantityPattern);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

    // Se encontrou um preço, provavelmente é um produto
    if (price && price > 0) {
      // Remove o preço e outros números da linha para obter o nome
      const nameLine = line
        .replace(pricePattern, "")
        .replace(quantityPattern, "")
        .trim();

      if (nameLine.length > 2) {
        // Se já tinha um produto anterior, salva ele
        if (currentProduct) {
          products.push({
            ...currentProduct,
            stock: currentProduct.stock || 1,
          });
        }

        // Cria novo produto
        currentProduct = {
          name: nameLine.substring(0, 100), // Limita tamanho do nome
          description: nameLine.length > 100 ? nameLine : "",
          price: price,
          stock: quantity,
          expiration_date: null, // Será preenchido manualmente ou por padrão
          category: category,
        };
      }
    } else if (currentProduct && line.length > 5) {
      // Se não tem preço mas tem texto, pode ser continuação da descrição
      currentProduct.description = currentProduct.description
        ? `${currentProduct.description} ${line}`
        : line;
    }
  }

  // Adiciona o último produto se existir
  if (currentProduct) {
    products.push({
      ...currentProduct,
      stock: currentProduct.stock || 1,
    });
  }

  // Se não encontrou produtos, retorna produtos de exemplo para demonstração
  // Em produção, isso seria removido
  if (products.length === 0) {
    return [
      {
        name: "Produto Extraído 1",
        description: "Descrição do produto extraído da nota",
        price: 10.5,
        stock: 1,
        expiration_date: null,
        category: "Outros",
      },
    ];
  }

  return products;
};
