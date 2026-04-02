import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Facebook, Instagram, Twitter, ExternalLink } from "lucide-react";
import { formatUrl } from "@/lib/utils";

interface LeaderContactDialogProps {
    leader: {
        name: string;
        email?: string;
        contactNumber?: string;
        socials?: {
            facebook?: string;
            instagram?: string;
            xHandle?: string;
        };
    };
    children: React.ReactNode;
}

export function LeaderContactDialog({ leader, children }: LeaderContactDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-strong border-0 rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{leader.name}</DialogTitle>
                    <DialogDescription>Leader Contact Details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        {leader.email && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Mail className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                                    <p className="text-sm">{leader.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`mailto:${leader.email}`}>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        )}

                        {leader.contactNumber && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Phone className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Phone</p>
                                    <p className="text-sm">{leader.contactNumber}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={`tel:${leader.contactNumber}`}>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>

                    {(leader.socials?.facebook || leader.socials?.instagram || leader.socials?.xHandle) && (
                        <div className="space-y-3 pt-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground px-1">Social Media</p>
                            <div className="grid grid-cols-1 gap-2">
                                {leader.socials?.facebook && (
                                    <a
                                        href={formatUrl(leader.socials.facebook)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Facebook className="h-4 w-4" />
                                        <span className="text-sm font-medium">Facebook</span>
                                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </a>
                                )}
                                {leader.socials?.instagram && (
                                    <a
                                        href={formatUrl(leader.socials.instagram)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 hover:bg-pink-500/20 transition-colors"
                                    >
                                        <Instagram className="h-4 w-4" />
                                        <span className="text-sm font-medium">Instagram</span>
                                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </a>
                                )}
                                {leader.socials?.xHandle && (
                                    <a
                                        href={formatUrl(leader.socials.xHandle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-foreground/10 border border-foreground/20 text-foreground hover:bg-foreground/20 transition-colors"
                                    >
                                        <Twitter className="h-4 w-4" />
                                        <span className="text-sm font-medium">X (Twitter)</span>
                                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {!leader.email && !leader.contactNumber && !leader.socials?.facebook && !leader.socials?.instagram && !leader.socials?.xHandle && (
                        <p className="text-sm text-center text-muted-foreground italic py-4">
                            No contact details provided yet.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
