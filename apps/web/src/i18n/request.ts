import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    const resolvedLocale = locale || 'he';
    try {
        const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
        return { locale: resolvedLocale, messages };
    } catch (error) {
        console.error(`Failed to load messages for locale: ${resolvedLocale}`, error);
        const fallback = (await import('../../messages/he.json')).default;
        return { locale: 'he', messages: fallback };
    }
});
