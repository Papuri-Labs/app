import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Image as ImageIcon,
    Plus,
    Filter,
    Search,
    ChevronRight,
    MoreVertical,
    Calendar,
    Unlock,
    Lock,
    Users,
    Heart,
    Trash2,
    Eye,
    Edit3,
    Loader2,
    Edit2,
    Globe,
    Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { getTracing } from "../lib/tracing";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Id } from "../../convex/_generated/dataModel";
import { ImageUpload } from "@/components/ImageUpload";
import { useViewMode } from "@/contexts/ViewModeContext";
import { PageHeader } from "./RolePages";

export function GalleryPage() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { user } = useAuth();
    const { viewMode } = useViewMode();
    const albums = useQuery(api.media.getAlbums, { orgSlug });
    const ministries = useQuery(api.ministries.list) || [];
    const createAlbum = useMutation(api.media.createAlbum);

    const [selectedAlbumId, setSelectedAlbumId] = useState<Id<"albums"> | null>(null);
    const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
    const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
    const [newAlbum, setNewAlbum] = useState({ title: "", description: "", ministryId: "global" });
    const [editingAlbum, setEditingAlbum] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateAlbum = useMutation(api.media.updateAlbum);

    // Role & Permission checks
    const isAdmin = user?.role === "admin";

    // Gradient theme based on viewMode/role
    const gradientTheme = isAdmin ? "gradient-admin" :
        viewMode === "leader" ? "gradient-leader" :
            viewMode === "member" ? "gradient-member" : "gradient-newcomer";

    // For leaders, we respect the viewMode (if they are in member/newcomer view, they should see fewer controls)
    const isLeader = isAdmin || (user?.role === "leader" && viewMode === "leader");

    const manageableMinistries = ministries.filter(m =>
        isAdmin || (isLeader && (user?.ministryIds || []).includes(m._id))
    );

    const handleCreateAlbum = async () => {
        if (!newAlbum.title) {
            toast.error("Please provide an album title");
            return;
        }

        setIsSubmitting(true);
        try {
            await createAlbum({
                title: newAlbum.title,
                description: newAlbum.description || undefined,
                isGlobal: newAlbum.ministryId === "global",
                ministryId: newAlbum.ministryId === "global" ? undefined : newAlbum.ministryId as Id<"ministries">,
                tracing: getTracing(),
            });
            toast.success("Album created successfully");
            setIsCreateAlbumOpen(false);
            setNewAlbum({ title: "", description: "", ministryId: "global" });
        } catch (error) {
            toast.error("Failed to create album");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateAlbum = async () => {
        if (!editingAlbum?.title) {
            toast.error("Please provide an album title");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateAlbum({
                id: editingAlbum._id,
                title: editingAlbum.title,
                description: editingAlbum.description,
                ministryId: editingAlbum.ministryId === "global" ? undefined : editingAlbum.ministryId as Id<"ministries"> | "global",
                isGlobal: editingAlbum.ministryId === "global",
                tracing: getTracing(),
            });
            toast.success("Album updated successfully");
            setIsEditAlbumOpen(false);
            setEditingAlbum(null);
        } catch (error) {
            toast.error("Failed to update album");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditAlbum = (album: any) => {
        setEditingAlbum({
            ...album,
            ministryId: album.isGlobal ? "global" : album.ministryId || "global", // Ensure ministryId is set for select
        });
        setIsEditAlbumOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <PageHeader
                            title="Church Gallery"
                            subtitle="Share and celebrate memories from our church life."
                            gradient={gradientTheme}
                        />
                    </div>

                    {isLeader && (
                        <Dialog open={isCreateAlbumOpen} onOpenChange={setIsCreateAlbumOpen}>
                            <DialogTrigger asChild>
                                <Button className="shrink-0 gap-2">
                                    <Plus className="h-4 w-4" /> Create Album
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-strong border-white/20">
                                <DialogHeader>
                                    <DialogTitle>Create New Album</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Album Title</Label>
                                        <Input
                                            placeholder="e.g. Worship Night 2024"
                                            value={newAlbum.title}
                                            onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description (Optional)</Label>
                                        <Textarea
                                            placeholder="Tell us about this album..."
                                            value={newAlbum.description}
                                            onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Visibility</Label>
                                        <Select
                                            value={newAlbum.ministryId}
                                            onValueChange={(val) => setNewAlbum({ ...newAlbum, ministryId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent className="glass-strong">
                                                {(isAdmin || user?.role === "leader") && <SelectItem value="global">Global (Everyone can see)</SelectItem>}
                                                {manageableMinistries.map((m) => (
                                                    <SelectItem key={m._id} value={m._id}>{m.name} Ministry</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateAlbumOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateAlbum} disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Album
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Edit Album Dialog */}
                    <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
                        <DialogContent className="glass-strong border-white/20">
                            <DialogHeader>
                                <DialogTitle>Edit Album</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Album Title</Label>
                                    <Input
                                        placeholder="e.g. Worship Night 2024"
                                        value={editingAlbum?.title || ""}
                                        onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea
                                        placeholder="Tell us about this album..."
                                        value={editingAlbum?.description || ""}
                                        onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Visibility</Label>
                                    <Select
                                        value={editingAlbum?.ministryId || (editingAlbum?.isGlobal ? "global" : "")}
                                        onValueChange={(val) => setEditingAlbum({ ...editingAlbum, ministryId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                        <SelectContent className="glass-strong">
                                            {(isAdmin || user?.role === "leader") && <SelectItem value="global">Global (Everyone can see)</SelectItem>}
                                            {manageableMinistries.map((m) => (
                                                <SelectItem key={m._id} value={m._id}>{m.name} Ministry</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditAlbumOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateAlbum} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {selectedAlbumId ? (
                    <AlbumDetailView
                        albumId={selectedAlbumId}
                        onBack={() => setSelectedAlbumId(null)}
                        isLeader={isLeader}
                        isAdmin={isAdmin}
                    />
                ) : (
                    <AlbumGrid
                        albums={albums || []}
                        onSelectAlbum={setSelectedAlbumId}
                        isAdmin={isAdmin}
                        isLeader={isLeader}
                        user={user}
                        onEditAlbum={handleEditAlbum}
                    />
                )}
            </div>
        </Layout>
    );
}

function AlbumGrid({ albums, onSelectAlbum, isAdmin, isLeader, user, onEditAlbum }: { albums: any[], onSelectAlbum: (id: Id<"albums">) => void, isAdmin: boolean, isLeader: boolean, user: any, onEditAlbum: (album: any) => void }) {
    const deleteAlbum = useMutation(api.media.deleteAlbum);

    const handleDeleteAlbum = async (e: React.MouseEvent, id: Id<"albums">, title: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete the album "${title}"? This will delete all photos inside.`)) return;

        try {
            await deleteAlbum({ id, tracing: getTracing() });
            toast.success("Album deleted");
        } catch (error) {
            toast.error("Failed to delete album");
        }
    };

    const handleEditAlbum = (e: React.MouseEvent, album: any) => {
        e.stopPropagation();
        onEditAlbum(album);
    };

    const canManageAlbum = (album: any) => {
        if (isAdmin) return true;
        if (!isLeader) return false;
        if (album.isGlobal) return true; // Leaders can manage global albums per latest request
        return album.ministryId && user?.ministryIds?.includes(album.ministryId);
    };

    if (albums.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-white/10">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No albums yet</h3>
                <p className="text-sm text-muted-foreground">Create your first album to start sharing memories.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
                <DashboardCard
                    key={album._id}
                    title={album.title}
                    className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                    onClick={() => onSelectAlbum(album._id)}
                >
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3 relative overflow-hidden group">
                        {album.coverUrl ? (
                            <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                {album.isGlobal ? (
                                    <Globe className="h-8 w-8 text-primary/20" />
                                ) : (
                                    <Users className="h-8 w-8 text-primary/20" />
                                )}
                                <span className="text-[10px] font-medium text-muted-foreground/50">Empty Album</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">View {album.photoCount || 0} Photos</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                        {album.description || "No description provided."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${album.isGlobal ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                                {album.isGlobal ? 'Global' : 'Ministry'}
                            </span>
                            {canManageAlbum(album) && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-primary hover:bg-primary/10"
                                        onClick={(e) => handleEditAlbum(e, album)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDeleteAlbum(e, album._id, album.title)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(album.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </DashboardCard>
            ))}
        </div>
    );
}

function AlbumDetailView({ albumId, onBack, isLeader, isAdmin }: { albumId: Id<"albums">, onBack: () => void, isLeader: boolean, isAdmin: boolean }) {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const album = useQuery(api.media.getAlbums, { orgSlug })?.find(a => a._id === albumId);
    const photos = useQuery(api.media.getPhotos, { albumId });
    const generateUploadUrl = useMutation(api.media.generateUploadUrl);
    const addPhoto = useMutation(api.media.addPhoto);
    const deletePhoto = useMutation(api.media.deletePhoto);

    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Strictly restrict management capabilities to leaders/admins
    const canManageAlbum = (isAdmin || isLeader) && (isAdmin || (album?.ministryId && user?.ministryIds?.includes(album.ministryId)));

    const handlePhotoSelected = async (file: File | null) => {
        if (!file) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await addPhoto({
                albumId,
                storageId,
                tracing: getTracing(),
            });
            toast.success("Photo added to album");
        } catch (error) {
            toast.error("Failed to add photo");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = async (e: React.MouseEvent, id: Id<"photos">) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this photo?")) return;

        try {
            await deletePhoto({ id, tracing: getTracing() });
            toast.success("Photo deleted");
        } catch (error) {
            toast.error("Failed to delete photo");
        }
    };

    if (!album) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold">{album.title}</h2>
                    <p className="text-sm text-muted-foreground">{album.description}</p>
                </div>
            </div>

            {canManageAlbum && (
                <DashboardCard title="Add Photos" icon={<ImageIcon className="h-5 w-5 text-primary" />} gradient={isAdmin ? "gradient-admin" : "gradient-leader"}>
                    <div className="p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Uploading photo...</p>
                            </div>
                        ) : (
                            <ImageUpload
                                onImageSelected={handlePhotoSelected}
                                label="Select Photo to Upload"
                            />
                        )}
                    </div>
                </DashboardCard>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos?.map((photo) => (
                    <div
                        key={photo._id}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group border border-white/10"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img
                            src={photo.url}
                            alt={photo.caption || "Photo"}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-4 text-white">
                            <div className="flex items-center gap-1 text-sm bg-black/50 px-2 py-1 rounded-full">
                                <Heart className="h-3.5 w-3.5 fill-current" /> {photo.reactionCount}
                            </div>
                            <div className="flex items-center gap-1 text-sm bg-black/50 px-2 py-1 rounded-full">
                                <MessageSquare className="h-3.5 w-3.5 fill-current" /> {photo.commentCount}
                            </div>
                            {canManageAlbum && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => handleDeletePhoto(e, photo._id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedPhoto && (
                <PhotoModal
                    photos={photos}
                    currentIndex={photos.findIndex(p => p._id === selectedPhoto._id)}
                    onClose={() => setSelectedPhoto(null)}
                    onNavigate={(photo) => setSelectedPhoto(photo)}
                    canManage={canManageAlbum}
                    albumTitle={album.title}
                />
            )}
        </div>
    );
}

function PhotoModal({ photos, currentIndex, onClose, canManage, onNavigate, albumTitle }: {
    photos: any[],
    currentIndex: number,
    onClose: () => void,
    canManage: boolean,
    onNavigate: (photo: any) => void,
    albumTitle: string
}) {
    const photo = photos[currentIndex];
    const { user } = useAuth();
    const addComment = useMutation(api.media.addComment);
    const reactToPhoto = useMutation(api.media.reactToPhoto);
    const deletePhoto = useMutation(api.media.deletePhoto);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => {
        if (currentIndex < photos.length - 1) {
            onNavigate(photos[currentIndex + 1]);
        } else {
            onNavigate(photos[0]); // Wrap to first
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onNavigate(photos[currentIndex - 1]);
        } else {
            onNavigate(photos[photos.length - 1]); // Wrap to last
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrevious();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex]);

    const handleReact = async () => {
        try {
            await reactToPhoto({ photoId: photo._id, type: "heart", tracing: getTracing() });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this photo?")) return;
        try {
            await deletePhoto({ id: photo._id, tracing: getTracing() });
            toast.success("Photo deleted");
            onClose();
        } catch (error) {
            toast.error("Failed to delete photo");
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await addComment({ photoId: photo._id, text: comment, tracing: getTracing() });
            setComment("");
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden glass-strong border-white/20">
                <div className="flex flex-col md:flex-row h-[80vh]">
                    <div className="relative aspect-auto max-h-[70vh] flex items-center justify-center bg-black/40 group">
                        <img
                            src={photo.url}
                            alt={photo.caption || "Church memory"}
                            className="max-h-[70vh] w-full object-contain"
                        />

                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevious}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>
                    <div className="w-full md:w-80 flex flex-col bg-background/50 backdrop-blur-xl border-l border-white/10">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <DialogTitle className="text-sm font-semibold">{albumTitle}</DialogTitle>
                            <div className="flex items-center gap-1">
                                {canManage && (
                                    <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                                    <Plus className="h-4 w-4 rotate-45" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={photo.hasReacted ? "default" : "outline"}
                                    size="sm"
                                    className="gap-2 shrink-0"
                                    onClick={handleReact}
                                >
                                    <Heart className={`h-4 w-4 ${photo.hasReacted ? 'fill-current' : ''}`} />
                                    {photo.reactionCount}
                                </Button>
                                <div className="text-xs text-muted-foreground">
                                    Posted {new Date(photo.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Comments ({photo.commentCount})</p>
                                {photo.comments.map((c: any) => (
                                    <div key={c._id} className="text-sm space-y-1 bg-white/5 p-2 rounded-lg">
                                        <p className="font-semibold text-[11px] text-primary">{c.userName}</p>
                                        <p className="text-xs leading-relaxed">{c.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <div className="p-4 border-t border-white/10 flex items-center gap-2">
                                <Input
                                    placeholder="Add a comment..."
                                    className="bg-white/5 border-white/10 focus:bg-white/10 transition-colors"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                />
                                <Button size="icon" onClick={handleAddComment} disabled={isSubmitting || !comment.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
