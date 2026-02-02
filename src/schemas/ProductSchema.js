import * as yup from "yup";

export const ProductSchema = yup.object().shape({
  name: yup.string().required("Este campo deve ser preenchido"),
  description: yup.string(),
  price: yup
    .number()
    .typeError("Informe um valor válido")
    .required("Este campo deve ser preenchido")
    .min(0, "O preço não pode ser negativo"),
  stock: yup
    .number()
    .typeError("Informe um valor válido")
    .required("Este campo deve ser preenchido")
    .integer("Deve ser um número inteiro")
    .min(0, "O estoque não pode ser negativo"),
  expiration_date: yup.date().nullable(),
  id_category: yup.string().nullable(),
});
