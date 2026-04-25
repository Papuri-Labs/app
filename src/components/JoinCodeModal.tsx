import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
  orgName: string;
}

export function JoinCodeModal({ isOpen, onClose, onJoin, orgName }: JoinCodeModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter the church access code");
      return;
    }

    setIsSubmitting(true);
    try {
      await onJoin(code.trim());
      // On success, the modal will be closed by the parent state change
    } catch (err: any) {
      console.error("Join failed:", err);
      if (err.message?.includes("INVALID_JOIN_CODE")) {
        toast.error("Incorrect church code", {
          description: "Please contact your church administrator for the correct code.",
        });
      } else {
        toast.error("Failed to join church", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-none shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        
        <DialogHeader className="relative">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">Protected Workspace</DialogTitle>
          <DialogDescription className="text-center pt-2">
            The workspace for <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">{orgName}</span> is private. Please enter the church access code to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4 relative">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Church Access Code
            </Label>
            <div className="relative group">
              <Input
                id="code"
                type="password"
                placeholder="••••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-12 border-muted hover:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                autoFocus
              />
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <p className="text-[10px] text-muted-foreground px-1 text-center">
              New members are assigned the "Newcomer" role by default.
            </p>
          </div>

          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 mt-2">
            <Button 
                type="submit" 
                className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Join Church"
              )}
            </Button>
            <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-11 rounded-xl text-muted-foreground hover:bg-muted" 
                onClick={onClose}
                disabled={isSubmitting}
            >
              Exit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
