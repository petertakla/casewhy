// Round 20, item 1 — format-only validation, no live USCIS lookup. A
// USCIS receipt number is a 3-letter service-center prefix followed by
// exactly 10 digits (e.g. EAC9999103403). This checks shape only; it can't
// confirm a receipt number is real, only that it's well-formed.
export const RECEIPT_NUMBER_PATTERN = /^[A-Z]{3}\d{10}$/;

export function isValidReceiptNumberFormat(value: string): boolean {
  return RECEIPT_NUMBER_PATTERN.test(value.trim().toUpperCase());
}
