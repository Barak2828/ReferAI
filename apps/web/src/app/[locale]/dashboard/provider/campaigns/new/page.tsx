"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { generateCampaignContent } from "@/app/actions/ai";
import { createCampaign } from "@/app/actions/campaign";
import { Loader2, Check, Copy } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export default function NewCampaignPage() {
    const t = useTranslations('Dashboard');
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'he';
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [language, setLanguage] = useState("he");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field on change
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
        setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name || formData.name.length < 3) {
            errors.name = 'Campaign name must be at least 3 characters';
        }
        if (!formData.description || formData.description.length < 10) {
            errors.description = 'Description must be at least 10 characters';
        }
        if (formData.cta && !/^https?:\/\/.+/.test(formData.cta)) {
            errors.cta = 'Must be a valid URL (starting with http:// or https://)';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        const value = parseFloat(formData.commissionValue);
        if (!formData.commissionValue || isNaN(value) || value <= 0) {
            errors.commissionValue = 'Commission must be a positive number';
        }
        if (formData.commissionType === 'percentage' && value > 100) {
            errors.commissionValue = 'Percentage cannot exceed 100%';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(step + 1);
    };

    const handleGenerate = async () => {
        if (!formData.description) return;

        const platforms = Object.entries(selectedPlatforms)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);

        if (platforms.length === 0) {
            toast('Please select at least one platform', 'error');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateCampaignContent({
                description: formData.description,
                platforms,
                language
            });

            if (result.success && result.content) {
                setGeneratedContent(result.content);
                toast('Content generated successfully!', 'success');
            } else {
                toast(result.error || 'Failed to generate content', 'error');
            }
        } catch (error) {
            console.error("Failed to generate content", error);
            toast('Failed to generate content. Please try again.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyContent = async (platform: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedPlatform(platform);
            toast(`${platform} content copied to clipboard`, 'success');
            setTimeout(() => setCopiedPlatform(null), 2000);
        } catch {
            toast('Failed to copy to clipboard', 'error');
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
                toast('Campaign launched successfully!', 'success');
                router.push(`/${locale}/dashboard/provider`);
            } else {
                toast(result.error || 'Failed to launch campaign', 'error');
            }
        } catch (error) {
            console.error("Failed to launch campaign", error);
            toast('An unexpected error occurred. Please try again.', 'error');
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
                                <label htmlFor="name" className="text-sm font-medium">{t('campaignNameLabel')}</label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder={t('campaignNamePlaceholder')}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium">{t('descriptionLabel')}</label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder={t('descriptionPlaceholder')}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                                {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="cta" className="text-sm font-medium">{t('callToActionLabel')}</label>
                                <Input
                                    id="cta"
                                    name="cta"
                                    placeholder={t('callToActionPlaceholder')}
                                    value={formData.cta}
                                    onChange={handleInputChange}
                                />
                                {formErrors.cta && <p className="text-sm text-red-500">{formErrors.cta}</p>}
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
                                <label htmlFor="commissionValue" className="text-sm font-medium">{t('commissionValueLabel')}</label>
                                <Input
                                    id="commissionValue"
                                    name="commissionValue"
                                    type="number"
                                    placeholder="10"
                                    min="0"
                                    max={formData.commissionType === 'percentage' ? '100' : undefined}
                                    value={formData.commissionValue}
                                    onChange={handleInputChange}
                                />
                                {formErrors.commissionValue && <p className="text-sm text-red-500">{formErrors.commissionValue}</p>}
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
                                    <label className="text-sm font-medium block mb-3 text-slate-700">{t('aiContentGenerationTitle')}</label>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {Object.entries(selectedPlatforms).map(([platform, checked]) => (
                                            <label
                                                key={platform}
                                                htmlFor={`platform-${platform}`}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <input
                                                    id={`platform-${platform}`}
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => handlePlatformToggle(platform as keyof typeof selectedPlatforms)}
                                                    className="accent-blue-600 h-4 w-4"
                                                />
                                                <span className="text-sm font-medium capitalize">{platform}</span>
                                            </label>
                                        ))}
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
                                            Generating Content...
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                        onClick={() => handleCopyContent(platform, text)}
                                                    >
                                                        {copiedPlatform === platform ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
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
                            <Button onClick={handleNextStep}>{t('nextButton')}</Button>
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
