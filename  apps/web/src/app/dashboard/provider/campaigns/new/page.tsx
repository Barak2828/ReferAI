"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function NewCampaignPage() {
    const [step, setStep] = useState(1);
    const [language, setLanguage] = useState("he");

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Create New Campaign</h1>
                <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Campaign Details"}
                        {step === 2 && "Commission & Rules"}
                        {step === 3 && "AI Content Generation (Text Only)"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Campaign Name</label>
                                <Input placeholder="e.g. Summer Sale 2025" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input placeholder="What are you promoting?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Call to Action (URL)</label>
                                <Input placeholder="https://yourwebsite.com/offer" />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Commission Type</label>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-full">Percentage (%)</Button>
                                    <Button variant="outline" className="w-full">Fixed Amount (₪)</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Commission Value</label>
                                <Input type="number" placeholder="10" />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-semibold text-blue-900 mb-2">AI Content Engine (Text)</h4>
                                <p className="text-sm text-blue-700 mb-4">
                                    We will generate optimized text captions for your promoters.
                                </p>

                                <div className="mb-4">
                                    <label className="text-sm font-medium block mb-2">Content Language</label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={language === 'he' ? 'default' : 'outline'}
                                            onClick={() => setLanguage('he')}
                                            size="sm"
                                        >
                                            Hebrew (עברית)
                                        </Button>
                                        <Button
                                            variant={language === 'en' ? 'default' : 'outline'}
                                            onClick={() => setLanguage('en')}
                                            size="sm"
                                        >
                                            English
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked readOnly /> <span>WhatsApp Message Template</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked readOnly /> <span>Instagram Caption</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked readOnly /> <span>LinkedIn Text Post</span>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full" variant="outline">Preview Generated Text</Button>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                        >
                            Back
                        </Button>
                        {step < 3 ? (
                            <Button onClick={() => setStep(step + 1)}>Next</Button>
                        ) : (
                            <Button className="bg-green-600 hover:bg-green-700">Launch Campaign</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
