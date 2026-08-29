"use client";

import { useState } from "react";
import { Copy, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResetOwnerCredentialsMutation } from "@/hooks/useBusiness";
import { asCredentialsResult, type CredentialsResult } from "@/lib/credentials-result";
import { cn, normalizeErrorMessage } from "@/lib/utils";

type OwnerCredentialsActionsProps = {
  businessId: string;
  ownerName?: string;
  ownerEmail?: string;
  compact?: boolean;
  selfService?: boolean;
};

export function OwnerCredentialsActions({
  businessId,
  ownerName,
  ownerEmail,
  compact = false,
  selfService = false,
}: OwnerCredentialsActionsProps) {
  const [resetOwner, { isLoading }] = useResetOwnerCredentialsMutation();
  const [setOpen, setSetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [alsoEmail, setAlsoEmail] = useState(true);
  const [shown, setShown] = useState<CredentialsResult | null>(null);

  const emailLabel = selfService ? "Email me a new password" : "Email new password";
  const setLabel = selfService ? "Set my password" : "Set password";

  const applyResult = (raw: unknown, fallbackEmail: string) => {
    const result = asCredentialsResult(raw) ?? {
      loginEmail: fallbackEmail,
      temporaryPassword: "",
      credentialsEmailSent: false,
    };
    setShown({
      ...result,
      loginEmail: result.loginEmail || fallbackEmail,
    });
    if (result.credentialsEmailSent) {
      toast.success("A new password was emailed.");
    } else {
      toast.warning(
        result.credentialsEmailError ||
          "Password was updated, but the email was not sent. Copy it below.",
      );
    }
  };

  const emailNewPassword = async () => {
    const toastId = toast.loading("Creating a new password…");
    try {
      const raw = await resetOwner({
        id: businessId,
        body: { generate: true, sendEmail: true },
      }).unwrap();
      toast.dismiss(toastId);
      applyResult(raw, ownerEmail || "");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to email a new password."), {
        id: toastId,
      });
    }
  };

  const onSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = password.trim();
    if (next.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    const toastId = toast.loading("Updating password…");
    try {
      const raw = await resetOwner({
        id: businessId,
        body: { password: next, sendEmail: alsoEmail },
      }).unwrap();
      toast.dismiss(toastId);
      setSetOpen(false);
      setPassword("");
      applyResult(raw, ownerEmail || "");
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update password."), {
        id: toastId,
      });
    }
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-end" : "")}>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void emailNewPassword()}
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          {emailLabel}
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60"
          disabled={isLoading}
          onClick={() => {
            setPassword("");
            setAlsoEmail(true);
            setSetOpen(true);
          }}
        >
          <KeyRound className="h-3.5 w-3.5" />
          {setLabel}
        </button>
      </div>

      <Dialog open={setOpen} onOpenChange={setSetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selfService ? "Change your password" : "Set owner password"}</DialogTitle>
            <DialogDescription>
              {selfService
                ? "This updates your business admin login."
                : `Set a password for ${ownerName || "the business admin"}${ownerEmail ? ` (${ownerEmail})` : ""}.`}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onSetPassword(event)}>
            <FormField label="New password" required>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={portalInputClass}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={alsoEmail}
                onChange={(event) => setAlsoEmail(event.target.checked)}
              />
              Email this password to {selfService ? "me" : "the business admin"}
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="dn-btn dn-btn-outline h-9 rounded-lg px-3 text-sm"
                onClick={() => setSetOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="dn-btn dn-btn-primary h-9 rounded-lg px-3 text-sm" disabled={isLoading}>
                Save password
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(shown)} onOpenChange={(open) => !open && setShown(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New login password</DialogTitle>
            <DialogDescription>
              {shown?.credentialsEmailSent
                ? "The new password was emailed. It is shown once here as a backup."
                : "Email was not sent. Copy this password and share it securely."}
            </DialogDescription>
          </DialogHeader>
          {shown ? (
            <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm">
              <p>
                <span className="text-[#64748b]">Email:</span>{" "}
                <span className="font-mono text-xs">{shown.loginEmail || ownerEmail}</span>
              </p>
              {shown.temporaryPassword ? (
                <p>
                  <span className="text-[#64748b]">Password:</span>{" "}
                  <span className="font-mono text-xs">{shown.temporaryPassword}</span>
                </p>
              ) : null}
              {!shown.credentialsEmailSent && shown.credentialsEmailError ? (
                <p className="text-xs text-[#b45309]">{shown.credentialsEmailError}</p>
              ) : null}
              <button
                type="button"
                className="dn-btn dn-btn-outline inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Email: ${shown.loginEmail || ownerEmail}\nPassword: ${shown.temporaryPassword}`,
                  );
                  toast.success("Credentials copied.");
                }}
              >
                <Copy className="h-4 w-4" />
                Copy credentials
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
