"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"

interface DeleteConfirmDialogProps {
  
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  loading?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the item.",
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
        <AlertDialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-2">
            <Trash2 className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-slate-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="rounded-xl bg-red-600 font-semibold text-[#ffffff] hover:bg-red-700 shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
