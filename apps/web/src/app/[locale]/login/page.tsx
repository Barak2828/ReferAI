"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import { login, signInWithOAuth } from "@/app/actions/auth";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        const result = await login(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to ReferAI</CardTitle>
                    <p className="text-sm text-muted-foreground">Sign in to manage your campaigns</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input name="email" type="email" placeholder="Email address" required />
                            <Input name="password" type="password" placeholder="Password" required />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">Sign In</Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => signInWithOAuth('google')}>Google</Button>
                        <Button variant="outline" onClick={() => signInWithOAuth('facebook')}>Meta</Button>
                    </div>

                    <div className="text-center text-sm">
                        <Link href="/dashboard/provider" className="text-blue-600 hover:underline">
                            [Demo] Go to Provider Dashboard
                        </Link>
                        <br />
                        <Link href="/dashboard/promoter" className="text-blue-600 hover:underline">
                            [Demo] Go to Promoter Dashboard
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
