import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ReferAI - Turn Your Network Into Revenue",
    description: "The first AI-powered social referral platform.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();
    const direction = locale === 'he' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} className="dark">
            <body className={`${inter.className} notranslate`}>
                <NextIntlClientProvider messages={messages}>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
