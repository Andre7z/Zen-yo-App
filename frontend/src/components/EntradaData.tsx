type Props = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  invalid?: boolean
}

export function EntradaData({ value, onChange, required = false, invalid = false }: Props) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      aria-invalid={invalid}
      maxLength={10}
      pattern="\d{2}/\d{2}/\d{4}"
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2'))}
    />
  )
}
