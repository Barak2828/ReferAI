'use server'

import { requireAuth } from '@/lib/auth-guard'

interface GenerateContentParams {
    description: string;
    platforms: string[];
    language: string;
}

export async function generateCampaignContent(data: GenerateContentParams) {
    // Require authentication
    const auth = await requireAuth()
    if (auth.error) {
        return { success: false, error: auth.error, content: {} }
    }

    // Validate input
    if (!data.description || data.description.length < 10) {
        return { success: false, error: 'Description must be at least 10 characters', content: {} }
    }
    if (!data.platforms || data.platforms.length === 0) {
        return { success: false, error: 'Select at least one platform', content: {} }
    }

    try {
        // Simulate AI latency (template-based for pilot)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const content: Record<string, string> = {};
        const { description, language } = data;

        if (language === 'he') {
            if (data.platforms.includes('whatsapp')) {
                content.whatsapp = `\u{1F44B} \u05D4\u05D9\u05D9! \u05E8\u05E6\u05D9\u05EA\u05D9 \u05DC\u05D4\u05DE\u05DC\u05D9\u05E5 \u05DC\u05DA \u05E2\u05DC ${description}. \n\n\u05D6\u05D4 \u05D1\u05D3\u05D9\u05D5\u05E7 \u05DE\u05D4 \u05E9\u05D7\u05D9\u05E4\u05E9\u05EA! \u05D4\u05E0\u05D4 \u05DC\u05D9\u05E0\u05E7 \u05E2\u05DD \u05D4\u05D8\u05D1\u05D4 \u05DE\u05D9\u05D5\u05D7\u05D3\u05EA: [LINK] \u{1F381}`;
            }
            if (data.platforms.includes('instagram')) {
                content.instagram = `\u2728 \u05D2\u05D9\u05DC\u05D9\u05EA\u05D9 \u05DE\u05E9\u05D4\u05D5 \u05DE\u05D3\u05D4\u05D9\u05DD: ${description}! \n\n\u05DE\u05DE\u05E9 \u05E9\u05D5\u05D5\u05D4 \u05D1\u05D3\u05D9\u05E7\u05D4. \u05DC\u05D9\u05E0\u05E7 \u05D1\u05D1\u05D9\u05D5! \u{1F517}\n\n#\u05D4\u05DE\u05DC\u05E6\u05D4 #\u05D8\u05D9\u05E4 #\u05D9\u05E9\u05E8\u05D0\u05DC #NewFind`;
            }
            if (data.platforms.includes('linkedin')) {
                content.linkedin = `\u{1F680} \u05E9\u05DE\u05D7 \u05DC\u05E9\u05EA\u05E3 \u05E9\u05D9\u05E8\u05D5\u05EA \u05DE\u05E6\u05D5\u05D9\u05DF \u05E9\u05E0\u05EA\u05E7\u05DC\u05EA\u05D9 \u05D1\u05D5 \u05DC\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4: ${description}.\n\n\u05E2\u05E8\u05DA \u05D0\u05DE\u05D9\u05EA\u05D9 \u05D5\u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05D5\u05EA \u05D1\u05E8\u05DE\u05D4 \u05D2\u05D1\u05D5\u05D4\u05D4. \u05DE\u05DE\u05DC\u05D9\u05E5 \u05D1\u05D7\u05D5\u05DD \u05DC\u05D1\u05D3\u05D5\u05E7! \u{1F447}\n\n[LINK]\n\n#\u05D7\u05D3\u05E9\u05E0\u05D5\u05EA #\u05E2\u05E1\u05E7\u05D9\u05DD #\u05D4\u05DE\u05DC\u05E6\u05D4 #Networking`;
            }
            if (data.platforms.includes('facebook')) {
                content.facebook = `\u{1F4E2} \u05D7\u05D1\u05E8\u05D9\u05DD, \u05E9\u05D9\u05DE\u05D5 \u05DC\u05D1! \n\n\u05E0\u05EA\u05E7\u05DC\u05EA\u05D9 \u05D1-${description} \u05D5\u05D4\u05D9\u05D9\u05EA\u05D9 \u05D7\u05D9\u05D9\u05D1 \u05DC\u05E9\u05EA\u05E3. \u05D6\u05D4 \u05E4\u05EA\u05E8\u05D5\u05DF \u05DE\u05E2\u05D5\u05DC\u05D4 \u05DC\u05DE\u05D9 \u05E9\u05DE\u05D7\u05E4\u05E9 \u05D0\u05D9\u05DB\u05D5\u05EA. \n\n\u05DB\u05DC \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05DB\u05D0\u05DF: [LINK] \u{1F44D}`;
            }
            if (data.platforms.includes('twitter')) {
                content.twitter = `\u05DE\u05E6\u05D0\u05EA\u05D9 \u05D0\u05EA \u05D6\u05D4: ${description} \u{1F92F}\n\n\u05E4\u05E9\u05D5\u05D8 \u05E2\u05D5\u05D1\u05D3. \u05EA\u05D5\u05D3\u05D5 \u05DC\u05D9 \u05D0\u05D7\u05E8 \u05DB\u05DA.\n\n[LINK]\n\n#\u05D4\u05DE\u05DC\u05E6\u05D4 #TechIL`;
            }
            if (data.platforms.includes('tiktok')) {
                content.tiktok = `[SCENE: \u05DE\u05D5\u05DC \u05DE\u05E6\u05DC\u05DE\u05D4, \u05D4\u05EA\u05DC\u05D4\u05D1\u05D5\u05EA]\n\n"\u05EA\u05E7\u05E9\u05D9\u05D1\u05D5, \u05D0\u05EA\u05DD \u05DC\u05D0 \u05DE\u05D0\u05DE\u05D9\u05E0\u05D9\u05DD \u05DE\u05D4 \u05DE\u05E6\u05D0\u05EA\u05D9..."\n\n[CUT: \u05DE\u05E6\u05D9\u05D2 \u05DE\u05E1\u05DA/\u05DE\u05D5\u05E6\u05E8]\n\n"${description} - \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4 \u05D0\u05EA \u05D4\u05DE\u05E9\u05D7\u05E7!"\n\n[SCENE: \u05D4\u05E6\u05D1\u05E2\u05D4 \u05DC\u05DC\u05D9\u05E0\u05E7]\n\n"\u05DC\u05D9\u05E0\u05E7 \u05D1\u05D1\u05D9\u05D5, \u05E8\u05D5\u05E6\u05D5!" \u{1F3C3}\u200D\u2642\uFE0F\u{1F4A8}\n\n#\u05E4\u05D5\u05E8\u05D9\u05D5 #\u05D8\u05D9\u05E7\u05D8\u05D5\u05E7\u05D9\u05E9\u05E8\u05D0\u05DC #LifeHack`;
            }
            if (data.platforms.includes('email')) {
                content.email = `\u05E0\u05D5\u05E9\u05D0: \u05D4\u05DE\u05DC\u05E6\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA: \u05DE\u05E9\u05D4\u05D5 \u05E9\u05D9\u05E2\u05E0\u05D9\u05D9\u05DF \u05D0\u05D5\u05EA\u05DA\n\n\u05D4\u05D9\u05D9,\n\n\u05E0\u05EA\u05E7\u05DC\u05EA\u05D9 \u05D1-${description} \u05D5\u05D7\u05E9\u05D1\u05EA\u05D9 \u05E2\u05DC\u05D9\u05DA.\n\n\u05DE\u05D3\u05D5\u05D1\u05E8 \u05D1\u05E4\u05EA\u05E8\u05D5\u05DF \u05E9\u05DE\u05DE\u05E9 \u05E2\u05D6\u05E8 \u05DC\u05D9/\u05D4\u05E8\u05E9\u05D9\u05DD \u05D0\u05D5\u05EA\u05D9, \u05D5\u05D1\u05D8\u05D5\u05D7 \u05E9\u05D6\u05D4 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05D9\u05D5\u05EA \u05E8\u05DC\u05D5\u05D5\u05E0\u05D8\u05D9 \u05D2\u05DD \u05E2\u05D1\u05D5\u05E8\u05DA.\n\n\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E8\u05D0\u05D5\u05EA \u05D0\u05EA \u05DB\u05DC \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05DB\u05D0\u05DF: [LINK]\n\n\u05D3\u05D1\u05E8 \u05D0\u05D9\u05EA\u05D9 \u05D0\u05DD \u05D9\u05E9 \u05E9\u05D0\u05DC\u05D5\u05EA!\n\n\u05D1\u05D1\u05E8\u05DB\u05D4,\n[\u05D4\u05E9\u05DD \u05E9\u05DC\u05DA]`;
            }
        } else {
            if (data.platforms.includes('whatsapp')) {
                content.whatsapp = `\u{1F44B} Hey! I wanted to recommend ${description} to you. \n\nCheck it out here, I think you'll love it: [LINK] \u{1F381}`;
            }
            if (data.platforms.includes('instagram')) {
                content.instagram = `\u2728 Just discovered ${description}! It's a game changer. \n\nLink in bio to verify! \u{1F517}\n\n#Recommendation #MustHave #Tip`;
            }
            if (data.platforms.includes('linkedin')) {
                content.linkedin = `\u{1F680} Excited to share this with my professional network: ${description}.\n\nOutstanding value and execution. Highly recommended! \u{1F447}\n\n[LINK]`;
            }
            if (data.platforms.includes('facebook')) {
                content.facebook = `\u{1F4E2} Heads up friends! \n\nI came across ${description} and just had to share. Great solution if you're looking for quality. \n\nDetails here: [LINK] \u{1F44D}`;
            }
            if (data.platforms.includes('twitter')) {
                content.twitter = `Found this: ${description} \u{1F92F}\n\nIt just works. Thank me later.\n\n[LINK]\n\n#Tech #Recommendation`;
            }
            if (data.platforms.includes('tiktok')) {
                content.tiktok = `[SCENE: Talking head, excited]\n\n"Guys, you won't believe what I found..."\n\n[CUT: Showing screen/product]\n\n"${description} - this is a game changer!"\n\n[SCENE: Pointing to link]\n\n"Link in bio, run!" \u{1F3C3}\u200D\u2642\uFE0F\u{1F4A8}\n\n#FYP #TikTokMadeMeBuyIt #LifeHack`;
            }
            if (data.platforms.includes('email')) {
                content.email = `Subject: Personal Recommendation: Check this out\n\nHi,\n\nI came across ${description} and thought of you.\n\nIt's a solution that really impressed me, and I'm sure it could be relevant for you too.\n\nYou can see all the details here: [LINK]\n\nLet me know if you have questions!\n\nBest,\n[Your Name]`;
            }
        }

        return { success: true, content };
    } catch (err) {
        console.error('Content generation error:', err)
        return { success: false, error: 'Failed to generate content. Please try again.', content: {} }
    }
}
