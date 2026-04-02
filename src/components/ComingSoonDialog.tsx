import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";

export function ComingSoonDialog({ children }: { children: ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Coming Soon</DialogTitle>
                    <DialogDescription>
                        This feature is currently under development. Please check back later!
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
