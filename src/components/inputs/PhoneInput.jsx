import React from "react";
import { IMaskInput } from "react-imask";
import TextField from "@mui/material/TextField";

const PhoneMaskCustom = React.forwardRef(function PhoneMaskCustom(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="+55 (00) 00000-0000"
      definitions={{
        0: /[0-9]/,
      }}
      inputRef={ref}
      onAccept={(value) => {
        // Remove a máscara e retorna apenas os números, mantendo o formato internacional
        const rawValue = value.replace(/\D/g, "");
        // Monta o valor no formato +55DDNNNNNNNN
        let formatted = "";
        if (rawValue.length >= 13) {
          formatted = `+${rawValue.slice(0, 2)}${rawValue.slice(2, 4)}${rawValue.slice(4)}`;
        } else if (rawValue.length >= 12) {
          formatted = `+${rawValue.slice(0, 2)}${rawValue.slice(2, 4)}${rawValue.slice(4)}`;
        } else {
          formatted = value;
        }
        onChange({ target: { name: props.name, value: formatted } });
      }}
      overwrite
    />
  );
});

export default function PhoneInput({ name, label, value, onChange, error }) {
  return (
    <TextField
      id={name}
      label={label}
      variant="outlined"
      fullWidth
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error}
      InputProps={{
        inputComponent: PhoneMaskCustom,
      }}
    />
  );
}
