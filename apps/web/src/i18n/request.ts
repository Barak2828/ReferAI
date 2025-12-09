import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    console.log(`Loading messages for locale: ${locale}`);
    try {
        const messages = (await import(`../../messages/${locale}.json`)).default;
        return { messages };
    } catch (error) {
        console.error(`Failed to load messages for locale: ${locale}`, error);
        return { messages: {} };
    }
});
