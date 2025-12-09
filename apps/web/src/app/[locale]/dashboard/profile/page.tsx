"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";

export default function ProfilePage() {
    const t = useTranslations('Dashboard'); // Assuming we'll add keys later
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        const result = await updateProfile(formData);
        if (result?.error) {
            setMessage(`Error: ${result.error}`);
        } else {
            setMessage('Profile updated successfully!');
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
                            <label className="text-sm font-medium">Full Name</label>
                            <Input name="name" placeholder="Your Name" required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select name="role" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="PROVIDER">Service Provider</option>
                                <option value="PROMOTER">Promoter</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Language</label>
                            <select name="locale" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="he">Hebrew (עברית)</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        {message && (
                            <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </p>
                        )}

                        <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
