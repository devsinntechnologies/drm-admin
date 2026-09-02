"use client";

import { useState } from "react";
import { KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { FormField, portalInputClass } from "@/components/admin/PortalPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type IssuePasswordPayload = {
  password?: string;
  generate: boolean;
  sendEmail: boolean;
  keepCurrentPassword: boolean;
};

type IssuePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personName: string;
  personEmail?: string;
  selfService?: boolean;
  hasPendingPassword?: boolean;
  isLoading?: boolean;
  onSubmit: (payload: IssuePasswordPayload) => Promise<void> | void;
  onCancelPending?: () => Promise<void> | void;
};

function randomPassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function IssuePasswordDialog({
  open,
  onOpenChange,
  personName,
  personEmail,
  selfService = false,
  hasPendingPassword = false,
  isLoading = false,
  onSubmit,
  onCancelPending,
}: IssuePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [keepCurrent, setKeepCurrent] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = () => {
    setPassword("");
    setShowPassword(false);
    setSendEmail(true);
    setKeepCurrent(true);
    setLocalError(null);
  };

  const handleOpen = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = password.trim();
    if (next && next.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    setLocalError(null);
    await onSubmit({
      password: next || undefined,
      generate: !next,
      sendEmail,
      keepCurrentPassword: keepCurrent,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a password</DialogTitle>
          <DialogDescription>
            {selfService
              ? "Choose whether your current login stays active."
              : `For ${personName}${personEmail ? ` · ${personEmail}` : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {hasPendingPassword ? (
            <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
              An extra password is already waiting. Creating another replaces that extra one — the current login stays as it is.
              {onCancelPending ? (
                <button
                  type="button"
                  className="mt-2 block text-xs font-semibold underline"
                  disabled={isLoading}
                  onClick={() => void onCancelPending()}
                >
                  Cancel the extra password
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setKeepCurrent(true)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                keepCurrent
                  ? "border-[#001840] bg-[#f8fafc] ring-2 ring-[#001840]/15"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <ShieldCheck className="h-4 w-4 text-[#059669]" />
                Keep current password working
              </span>
              <span className="mt-1 block text-xs text-[#64748b]">
                Recommended. They can still sign in with the old password until they use this new one.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setKeepCurrent(false)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                !keepCurrent
                  ? "border-[#b91c1c] bg-[#fef2f2] ring-2 ring-[#b91c1c]/10"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <KeyRound className="h-4 w-4 text-[#b91c1c]" />
                Replace now
              </span>
              <span className="mt-1 block text-xs text-[#64748b]">
                The old password stops working immediately.
              </span>
            </button>
          </div>

          <FormField label="New password">
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={portalInputClass}
                placeholder="Leave blank to generate one"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="dn-btn dn-btn-outline inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm"
                onClick={() => {
                  setPassword(randomPassword());
                  setShowPassword(true);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>
          </FormField>
          {localError ? <p className="text-sm font-medium text-[#c53030]">{localError}</p> : null}

          <label className="flex items-start gap-2 text-sm text-[#334155]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            <span>
              Email this password to {selfService ? "me" : personName}
              {personEmail && !selfService ? (
                <span className="block text-xs text-[#64748b]">{personEmail}</span>
              ) : null}
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="dn-btn dn-btn-outline h-9 rounded-lg px-3 text-sm"
              onClick={() => handleOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="dn-btn dn-btn-primary h-9 rounded-lg px-3 text-sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : keepCurrent ? (
                "Create extra password"
              ) : (
                "Replace password"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
