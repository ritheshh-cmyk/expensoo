/**
 * ConfirmModal — replaces all window.confirm() calls globally.
 * Usage:
 *   const { confirm, ConfirmModalElement } = useConfirm();
 *   ...
 *   const ok = await confirm({ title: "Delete?", description: "This cannot be undone." });
 *   if (ok) { ... }
 *   ...
 *   return <>{ConfirmModalElement}</>
 */
import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: (value: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolveRef.current(result);
    setState(null);
  };

  const ConfirmModalElement = state ? (
    <Dialog open={state.open} onOpenChange={(open) => { if (!open) handleClose(false); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {state.variant === "danger" ? (
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
            )}
            <DialogTitle className="text-base font-semibold text-foreground leading-tight">
              {state.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {state.description && (
          <p className="text-sm text-muted-foreground px-1 -mt-2">
            {state.description}
          </p>
        )}

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[80px]"
            onClick={() => handleClose(false)}
          >
            {state.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            size="sm"
            className={cn(
              "min-w-[80px]",
              state.variant === "danger"
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : ""
            )}
            onClick={() => handleClose(true)}
          >
            {state.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { confirm, ConfirmModalElement };
}
