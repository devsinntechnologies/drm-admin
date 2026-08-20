/** Shared form helpers for business create and portal forms. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Expected national digit counts by calling-code prefix. */
const PHONE_DIGIT_RULES: Record<string, { min: number; max: number; hint: string }> = {
  "+92": { min: 10, max: 10, hint: "10 digits (e.g. 3001234567)" },
  "+44": { min: 10, max: 10, hint: "10 digits (e.g. 7123456789)" },
  "+1": { min: 10, max: 10, hint: "10 digits" },
  "+971": { min: 9, max: 9, hint: "9 digits" },
  "+91": { min: 10, max: 10, hint: "10 digits" },
};

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(String(value || "").trim());
}

export function validateEmail(value: string): string | null {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Email is required";
  if (!isValidEmail(trimmed)) return "Enter a valid email address";
  return null;
}

export function validatePhoneNumber(
  countryCode: string,
  nationalNumber: string,
): string | null {
  const digits = digitsOnly(nationalNumber);
  if (!digits) return "Phone number is required";

  const rule = PHONE_DIGIT_RULES[countryCode];
  if (rule) {
    if (digits.length < rule.min || digits.length > rule.max) {
      return `Phone must be ${rule.hint}`;
    }
    return null;
  }

  if (digits.length < 7 || digits.length > 15) {
    return "Phone must be 7–15 digits";
  }
  return null;
}

export function formatE164(countryCode: string, nationalNumber: string): string {
  return `${countryCode}${digitsOnly(nationalNumber)}`;
}
