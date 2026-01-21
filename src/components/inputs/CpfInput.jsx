import React from "react";
import { IMaskInput } from "react-imask";
import TextField from "@mui/material/TextField";

const TextMaskCustom = React.forwardRef(function TextMaskCustom(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="000.000.000-00"
      definitions={{
        0: /[0-9]/,
      }}
      inputRef={ref}
      onAccept={(value) => {
        // Remove a máscara e retorna apenas os números
        const rawValue = value.replace(/\D/g, "");
        onChange({ target: { name: props.name, value: rawValue } });
      }}
      overwrite
    />
  );
});

export default function CpfInput({ name, label, value, onChange, error }) {
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
        inputComponent: TextMaskCustom,
      }}
    />
  );
}
