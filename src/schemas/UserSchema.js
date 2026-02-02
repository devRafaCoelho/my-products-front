import * as yup from "yup";

export const UserSchema = yup.object().shape({
  firstName: yup.string().required("Este campo deve ser preenchido"),
  lastName: yup.string().required("Este campo deve ser preenchido"),
  email: yup.string().required("Este campo deve ser preenchido"),
  cpf: yup.string(),
  phone: yup.string(),
  password: yup.string().required("Este campo deve ser preenchido"),
});

export const ProfileSchema = yup.object().shape({
  firstName: yup.string().required("Este campo deve ser preenchido"),
  lastName: yup.string().required("Este campo deve ser preenchido"),
  phone: yup.string(),
});

export const NewPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required("A senha é obrigatória.")
    .min(5, "A senha deve conter pelo menos 5 caracteres."),
  newPassword: yup
    .string()
    .required("A nova senha é obrigatória.")
    .min(5, "A nova senha deve conter pelo menos 5 caracteres."),
  confirmNewPassword: yup
    .string()
    .required("A confirmação da nova senha é obrigatória.")
    .oneOf([yup.ref("newPassword")], "As senhas não correspondem."),
});
