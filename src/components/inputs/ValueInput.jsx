import React from "react";
import { IMaskInput } from "react-imask";
import TextField from "@mui/material/TextField";

const CurrencyMaskCustom = React.forwardRef(
  function CurrencyMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="$ num"
        blocks={{
          num: {
            mask: Number,
            thousandsSeparator: ",",
            radix: ".",
            scale: 2,
            normalizeZeros: true,
            padFractionalZeros: true,
            signed: false,
          },
        }}
        inputRef={ref}
        onAccept={(value) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  },
);

export default function ValueInput({ name, label, register, errors }) {
  return (
    <TextField
      id={name}
      label={label}
      variant="outlined"
      fullWidth
      {...register(name)}
      error={!!errors?.[name]}
      helperText={errors?.[name] ? errors[name].message : null}
      InputProps={{
        inputComponent: CurrencyMaskCustom,
      }}
    />
  );
}
