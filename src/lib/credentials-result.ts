export type CredentialsResult = {
  loginEmail: string;
  temporaryPassword: string;
  credentialsEmailSent: boolean;
  credentialsEmailError?: string;
  keepCurrentPassword?: boolean;
  hasPendingPassword?: boolean;
};

export type ResetCredentialsPayload = {
  password?: string;
  generate?: boolean;
  sendEmail?: boolean;
  keepCurrentPassword?: boolean;
  cancelPending?: boolean;
};

export function asCredentialsResult(raw: unknown): CredentialsResult | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const loginEmail =
    typeof data.loginEmail === "string"
      ? data.loginEmail
      : typeof data.email === "string"
        ? data.email
        : "";
  const temporaryPassword =
    typeof data.temporaryPassword === "string" ? data.temporaryPassword : "";
  if (!temporaryPassword && data.credentialsEmailSent === undefined) {
    return null;
  }

  return {
    loginEmail,
    temporaryPassword,
    credentialsEmailSent: data.credentialsEmailSent === true,
    credentialsEmailError:
      typeof data.credentialsEmailError === "string"
        ? data.credentialsEmailError
        : undefined,
    keepCurrentPassword: data.keepCurrentPassword !== false,
    hasPendingPassword: data.hasPendingPassword === true,
  };
}
