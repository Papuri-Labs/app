import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecordGivingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Get members in the finance user's ministry
    const members = useQuery(api.users.getMemberDirectory) || [];
    const ministryMembers = members.filter(m =>
        m.ministryIds?.some(id => user?.ministryIds?.includes(id))
    );

    const recordTransaction = useMutation(api.givingTransactions.recordTransaction);

    const settings = useQuery(api.settings.get);
    const defaultGivingTypes = ["Tithe", "Offering", "Pledge", "Special Offering", "Mission", "Building Fund"];
    const givingTypes = settings?.givingTypes || defaultGivingTypes;

    const [formData, setFormData] = useState({
        userId: "",
        amount: "",
        givingType: givingTypes[0] || "Tithe",
        date: new Date().toISOString().split('T')[0],
        notes: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userId || !formData.amount) return;

        setIsSubmitting(true);
        try {
            await recordTransaction({
                userId: formData.userId as any,
                amount: parseFloat(formData.amount),
                givingType: formData.givingType,
                date: formData.date,
                ministryId: user?.ministryIds?.[0] as any,
                notes: formData.notes || undefined,
            });

            // Reset form and navigate back
            setFormData({
                userId: "",
                amount: "",
                givingType: givingTypes[0] || "Tithe",
                date: new Date().toISOString().split('T')[0],
                notes: "",
            });

            alert("Transaction recorded successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Error recording transaction:", error);
            alert("Failed to record transaction. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                {/* Header */}
                <div className="gradient-member glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Record Giving</h1>
                    <p className="text-muted-foreground relative">
                        Record a new giving transaction for a member
                    </p>
                </div>

                {/* Form */}
                <DashboardCard
                    title="Transaction Details"
                    icon={<Heart className="h-5 w-5 text-accent" />}
                    gradient="gradient-member"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Member Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="member">Member *</Label>
                            <Select
                                value={formData.userId}
                                onValueChange={(value) => setFormData({ ...formData, userId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ministryMembers.map((member) => (
                                        <SelectItem key={member._id} value={member._id}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₱) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>

                        {/* Giving Type */}
                        <div className="space-y-2">
                            <Label htmlFor="givingType">Giving Type *</Label>
                            <Select
                                value={formData.givingType}
                                onValueChange={(value) => setFormData({ ...formData, givingType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {givingTypes.map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any additional notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? "Recording..." : "Record Transaction"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DashboardCard>
            </div>
        </>
    );
}
