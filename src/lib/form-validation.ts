/** Shared form helpers for business create and portal forms. */

import { normalizeErrorMessage } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Expected national digit counts by calling-code prefix. */
const PHONE_DIGIT_RULES: Record<
  string,
  { min: number; max: number; hint: string; pattern?: RegExp }
> = {
  "+92": {
    min: 10,
    max: 10,
    hint: "10-digit mobile starting with 3 (e.g. 3001234567)",
    pattern: /^3\d{9}$/,
  },
  "+44": {
    min: 10,
    max: 10,
    hint: "10 digits starting with 7 (e.g. 7123456789)",
    pattern: /^7\d{9}$/,
  },
  "+1": { min: 10, max: 10, hint: "10 digits", pattern: /^\d{10}$/ },
  "+971": {
    min: 9,
    max: 9,
    hint: "9 digits starting with 5 (e.g. 501234567)",
    pattern: /^5\d{8}$/,
  },
  "+91": { min: 10, max: 10, hint: "10 digits", pattern: /^[6-9]\d{9}$/ },
};

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

/** Strip trunk prefixes users often type in the national number field. */
export function normalizeNationalNumber(countryCode: string, nationalNumber: string): string {
  let digits = digitsOnly(nationalNumber);

  if (countryCode === "+92" && digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (countryCode === "+44" && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (countryCode === "+1" && digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  return digits;
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
  const digits = normalizeNationalNumber(countryCode, nationalNumber);
  if (!digits) return "Phone number is required";

  const rule = PHONE_DIGIT_RULES[countryCode];
  if (rule) {
    if (digits.length < rule.min || digits.length > rule.max) {
      return `Phone must be ${rule.hint}`;
    }
    if (rule.pattern && !rule.pattern.test(digits)) {
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
  return `${countryCode}${normalizeNationalNumber(countryCode, nationalNumber)}`;
}

export type BusinessProfileFieldErrors = Partial<
  Record<"businessName" | "manager" | "email" | "phone" | "address" | "planId", string>
>;

export function validateBusinessProfileFields(input: {
  businessName: string;
  manager: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  address: string;
  planId: string;
}): BusinessProfileFieldErrors | null {
  const errors: BusinessProfileFieldErrors = {};

  if (!input.businessName.trim()) errors.businessName = "Business name is required";
  if (!input.manager.trim()) errors.manager = "Manager / owner is required";
  if (!input.address.trim()) errors.address = "Address is required";
  if (!input.planId) errors.planId = "Select a plan";

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhoneNumber(input.countryCode, input.phoneNumber);
  if (phoneError) errors.phone = phoneError;

  return Object.keys(errors).length ? errors : null;
}

export type BusinessApiField = keyof BusinessProfileFieldErrors;

function friendlyBusinessFieldMessage(field: BusinessApiField, raw: string): string {
  const lower = raw.toLowerCase();
  if (field === "phone" && lower.includes("valid phone")) {
    return "Enter a valid mobile number for the selected country (without leading 0). Example for Pakistan: 3001234567.";
  }
  if (field === "email" && lower.includes("email")) {
    return "Enter a valid owner email address.";
  }
  return raw;
}

/** Map NestJS validation errors back to business profile form fields. */
export function resolveBusinessApiError(error: unknown): {
  message: string;
  field?: BusinessApiField;
} {
  const message = normalizeErrorMessage(error, "Failed to save business. Please try again.");
  const lower = message.toLowerCase();

  if (lower.includes("phone")) {
    return { message: friendlyBusinessFieldMessage("phone", message), field: "phone" };
  }
  if (lower.includes("email")) {
    return { message: friendlyBusinessFieldMessage("email", message), field: "email" };
  }
  if (lower.includes("businessname") || lower.includes("business name")) {
    return { message, field: "businessName" };
  }
  if (lower.includes("address")) {
    return { message, field: "address" };
  }
  if (lower.includes("manager")) {
    return { message, field: "manager" };
  }
  if (lower.includes("plan")) {
    return { message, field: "planId" };
  }

  return { message };
}
