"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IssuePasswordDialog } from "@/components/business/IssuePasswordDialog";
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
  hasPendingPassword?: boolean;
};

export function OwnerCredentialsActions({
  businessId,
  ownerName,
  ownerEmail,
  compact = false,
  selfService = false,
  hasPendingPassword = false,
}: OwnerCredentialsActionsProps) {
  const [resetOwner, { isLoading }] = useResetOwnerCredentialsMutation();
  const [setOpen, setSetOpen] = useState(false);
  const [shown, setShown] = useState<CredentialsResult | null>(null);
  const [pending, setPending] = useState(hasPendingPassword);

  useEffect(() => {
    setPending(hasPendingPassword);
  }, [hasPendingPassword]);

  const applyResult = (raw: unknown, fallbackEmail: string) => {
    const result = asCredentialsResult(raw) ?? {
      loginEmail: fallbackEmail,
      temporaryPassword: "",
      credentialsEmailSent: false,
    };
    setPending(result.hasPendingPassword ?? pending);
    setShown({
      ...result,
      loginEmail: result.loginEmail || fallbackEmail,
    });
    if (result.keepCurrentPassword !== false) {
      toast.success("Extra password created. The current login still works.");
    } else if (result.credentialsEmailSent) {
      toast.success("Password replaced and emailed.");
    } else {
      toast.warning(
        result.credentialsEmailError ||
          "Password was updated, but the email was not sent. Copy it below.",
      );
    }
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-end" : "")}>
        {pending ? (
          <span className="rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-[11px] font-semibold text-[#b45309] ring-1 ring-[#fde68a]">
            Extra password waiting
          </span>
        ) : null}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60"
          disabled={isLoading}
          onClick={() => setSetOpen(true)}
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
          Password
        </button>
      </div>

      <IssuePasswordDialog
        open={setOpen}
        onOpenChange={setSetOpen}
        personName={ownerName || "the business admin"}
        personEmail={ownerEmail}
        selfService={selfService}
        hasPendingPassword={pending}
        isLoading={isLoading}
        onSubmit={async (payload) => {
          const toastId = toast.loading(
            payload.keepCurrentPassword ? "Creating extra password…" : "Replacing password…",
          );
          try {
            const raw = await resetOwner({
              id: businessId,
              body: payload,
            }).unwrap();
            toast.dismiss(toastId);
            setSetOpen(false);
            applyResult(raw, ownerEmail || "");
          } catch (err) {
            toast.error(normalizeErrorMessage(err, "Failed to update password."), {
              id: toastId,
            });
          }
        }}
        onCancelPending={async () => {
          const toastId = toast.loading("Cancelling extra password…");
          try {
            await resetOwner({
              id: businessId,
              body: { cancelPending: true, sendEmail: false },
            }).unwrap();
            setPending(false);
            setSetOpen(false);
            toast.success("Extra password cancelled. Current login is unchanged.", { id: toastId });
          } catch (err) {
            toast.error(normalizeErrorMessage(err, "Could not cancel the extra password."), {
              id: toastId,
            });
          }
        }}
      />

      <Dialog open={Boolean(shown)} onOpenChange={(open) => !open && setShown(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shown?.keepCurrentPassword === false ? "Password replaced" : "Extra password ready"}
            </DialogTitle>
            <DialogDescription>
              {shown?.keepCurrentPassword === false
                ? "The previous password no longer works."
                : "The current password still works until they sign in with this new one."}
              {shown?.credentialsEmailSent
                ? " A copy was emailed. It is shown once here as a backup."
                : " Email was not sent — copy it and share it securely."}
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
