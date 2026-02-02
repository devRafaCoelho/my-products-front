import { NumericFormat } from "react-number-format";
import TextField from "@mui/material/TextField";

export default function PriceInput({ name, label, value, onChange, error }) {
  const numValue =
    value !== null && value !== undefined && value !== ""
      ? Number(value)
      : null;

  return (
    <NumericFormat
      id={name}
      name={name}
      label={label}
      variant="outlined"
      fullWidth
      customInput={TextField}
      value={numValue ?? ""}
      onValueChange={(values) => {
        const val = values.floatValue ?? null;
        onChange({ target: { name, value: val } });
      }}
      prefix="R$ "
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      error={!!error}
      helperText={error}
    />
  );
}
