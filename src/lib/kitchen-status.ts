// Kitchen ladder shared by the Kitchen and Orders pages (same as the app):
// pending → received → cooking → served. Orders shows the stage until the
// kitchen serves, then offers Complete (which raises the invoice).

export type KitchenStage = "new" | "received" | "cooking" | "ready" | "served";

export function kitchenStage(status?: string | null): KitchenStage {
  const s = String(status ?? "").trim().toLowerCase();
  if (["received", "acknowledged"].includes(s)) return "received";
  if (["preparing", "cooking", "in_progress", "in-progress", "inprogress"].includes(s)) return "cooking";
  if (s === "ready") return "ready";
  if (["served", "completed", "complete", "delivered"].includes(s)) return "served";
  return "new";
}

export function nextKitchenStatus(status?: string | null): string {
  switch (kitchenStage(status)) {
    case "new":
      return "received";
    case "received":
      return "cooking";
    default:
      return "served";
  }
}

export function kitchenActionLabel(status?: string | null): string {
  switch (kitchenStage(status)) {
    case "new":
      return "MARK AS RECEIVED";
    case "received":
      return "START COOKING";
    case "served":
      return "COMPLETED";
    default:
      return "MARK AS SERVED";
  }
}

/** Kitchen is done with the order, so the cashier may complete it. */
export function isKitchenFinished(status?: string | null): boolean {
  const stage = kitchenStage(status);
  return stage === "ready" || stage === "served";
}

/** Label shown on the Orders page in place of Complete while the kitchen works. */
export function kitchenProgressLabel(status?: string | null): string {
  switch (kitchenStage(status)) {
    case "received":
      return "Received in kitchen";
    case "cooking":
      return "Cooking";
    default:
      return "Waiting for kitchen";
  }
}
