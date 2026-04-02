import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function GivingDialog({
    selectedGiving,
    onClose
}: {
    selectedGiving: any;
    onClose: () => void
}) {
    return (
        <Dialog open={!!selectedGiving} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md glass-strong border-0 rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{selectedGiving?.label}</DialogTitle>
                    <DialogDescription>Scan the QR code to complete your contribution.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    {selectedGiving?.qrCodeUrl ? (
                        <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/20">
                            <img src={selectedGiving.qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                        </div>
                    ) : (
                        <div className="w-64 h-64 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-xs text-center px-4 italic">
                            No QR code maintained for this giving option. Please contact your administrator.
                        </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                        Thank you for your generosity in supporting our ministry.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
