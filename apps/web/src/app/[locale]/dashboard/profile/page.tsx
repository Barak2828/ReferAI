"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { useToast } from "@/components/ui/toast-provider";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const t = useTranslations('Dashboard');
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            const result = await updateProfile(formData);
            if (result?.success) {
                toast('Profile updated successfully!', 'success');
            } else {
                toast(result?.error || 'Failed to update profile', 'error');
            }
        } catch {
            toast('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Profile Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                            <Input id="name" name="name" placeholder="Your Name" required minLength={2} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="text-sm font-medium">Role</label>
                            <select
                                id="role"
                                name="role"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="PROVIDER">Service Provider</option>
                                <option value="PROMOTER">Promoter</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="locale" className="text-sm font-medium">Language</label>
                            <select
                                id="locale"
                                name="locale"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="he">Hebrew ({'\u05E2\u05D1\u05E8\u05D9\u05EA'})</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
