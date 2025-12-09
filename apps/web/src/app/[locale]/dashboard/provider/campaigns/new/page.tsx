"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // Assuming this component exists or we use standard textarea
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { generateCampaignContent } from "@/app/actions/ai";
import { createCampaign } from "@/app/actions/campaign";
import { Loader2, Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [language, setLanguage] = useState("he");

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        cta: "",
        commissionType: "percentage",
        commissionValue: "",
    });

    const [selectedPlatforms, setSelectedPlatforms] = useState({
        whatsapp: true,
        instagram: true,
        linkedin: true,
        facebook: false,
        twitter: false,
        tiktok: false,
        email: false
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<Record<string, string> | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
        setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    const handleGenerate = async () => {
        if (!formData.description) return;

        setIsGenerating(true);
        try {
            const platforms = Object.entries(selectedPlatforms)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => key);

            const result = await generateCampaignContent({
                description: formData.description,
                platforms,
                language
            });

            if (result.success && result.content) {
                setGeneratedContent(result.content);
            }
        } catch (error) {
            console.error("Failed to generate content", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLaunch = async () => {
        setIsLaunching(true);
        try {
            const result = await createCampaign({
                name: formData.name,
                description: formData.description,
                cta: formData.cta,
                commission: parseFloat(formData.commissionValue) || 0
            });

            if (result.success) {
                router.push('/dashboard/provider');
            } else {
                alert(`Error: ${result.error}`); // Simple error handling for now
            }
        } catch (error) {
            console.error("Failed to launch campaign", error);
            alert("Unexpected error occurred");
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('provider')} - Create Campaign</h1>
                <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && t('campaignDetailsTitle')}
                        {step === 2 && t('commissionRulesTitle')}
                        {step === 3 && t('aiContentGenerationTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('campaignNameLabel')}</label>
                                <Input
                                    name="name"
                                    placeholder={t('campaignNamePlaceholder')}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('descriptionLabel')}</label>
                                <Input
                                    name="description"
                                    placeholder={t('descriptionPlaceholder')}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('callToActionLabel')}</label>
                                <Input
                                    name="cta"
                                    placeholder={t('callToActionPlaceholder')}
                                    value={formData.cta}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('commissionTypeLabel')}</label>
                                <div className="flex gap-4">
                                    <Button
                                        variant={formData.commissionType === 'percentage' ? 'default' : 'outline'}
                                        className="w-full"
                                        onClick={() => setFormData({ ...formData, commissionType: 'percentage' })}
                                    >
                                        {t('percentageCommission')}
                                    </Button>
                                    <Button
                                        variant={formData.commissionType === 'fixed' ? 'default' : 'outline'}
                                        className="w-full"
                                        onClick={() => setFormData({ ...formData, commissionType: 'fixed' })}
                                    >
                                        {t('fixedAmountCommission')}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('commissionValueLabel')}</label>
                                <Input
                                    name="commissionValue"
                                    type="number"
                                    placeholder="10"
                                    value={formData.commissionValue}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-6">
                                <div>
                                    <h4 className="font-semibold text-blue-900 mb-1">{t('aiContentEngineTextTitle')}</h4>
                                    <p className="text-sm text-blue-600/80">
                                        {t('aiContentEngineTextDescription')}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-3 text-slate-700">{t('contentLanguageLabel')}</label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={language === 'he' ? 'default' : 'outline'}
                                            onClick={() => setLanguage('he')}
                                            size="sm"
                                            className="w-24"
                                        >
                                            {t('hebrewLanguage')}
                                        </Button>
                                        <Button
                                            variant={language === 'en' ? 'default' : 'outline'}
                                            onClick={() => setLanguage('en')}
                                            size="sm"
                                            className="w-24"
                                        >
                                            {t('englishLanguage')}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-3 text-slate-700">Target Platforms</label>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.whatsapp ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.whatsapp}
                                                onChange={() => handlePlatformToggle('whatsapp')}
                                                className="accent-blue-600 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('whatsappTemplate')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.instagram ? 'bg-white border-pink-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.instagram}
                                                onChange={() => handlePlatformToggle('instagram')}
                                                className="accent-pink-600 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('instagramCaption')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.linkedin ? 'bg-white border-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.linkedin}
                                                onChange={() => handlePlatformToggle('linkedin')}
                                                className="accent-blue-700 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('linkedinPost')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.facebook ? 'bg-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.facebook}
                                                onChange={() => handlePlatformToggle('facebook')}
                                                className="accent-blue-600 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('facebookAd')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.twitter ? 'bg-white border-sky-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.twitter}
                                                onChange={() => handlePlatformToggle('twitter')}
                                                className="accent-sky-500 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('twitterPost')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.tiktok ? 'bg-white border-black shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.tiktok}
                                                onChange={() => handlePlatformToggle('tiktok')}
                                                className="accent-black h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('tiktokScript')}</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPlatforms.email ? 'bg-white border-indigo-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.email}
                                                onChange={() => handlePlatformToggle('email')}
                                                className="accent-indigo-500 h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">{t('emailNewsletter')}</span>
                                        </label>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !formData.description}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generatng Content...
                                        </>
                                    ) : (
                                        t('previewTextButton')
                                    )}
                                </Button>
                            </div>

                            {generatedContent && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        Generated Content
                                    </h3>
                                    <div className="grid gap-4">
                                        {Object.entries(generatedContent).map(([platform, text]) => (
                                            <div key={platform} className="bg-white p-4 rounded-lg border shadow-sm relative group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-bold uppercase text-muted-foreground">{platform}</span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between pt-6 border-t mt-6">
                        <Button
                            variant="ghost"
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                        >
                            {t('backButton')}
                        </Button>
                        {step < 3 ? (
                            <Button onClick={() => setStep(step + 1)}>{t('nextButton')}</Button>
                        ) : (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleLaunch}
                                disabled={isLaunching}
                            >
                                {isLaunching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('launchCampaignButton')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

