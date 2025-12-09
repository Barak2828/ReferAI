'use server'

interface GenerateContentParams {
    description: string;
    platforms: string[]; // 'whatsapp', 'instagram', 'linkedin'
    language: string; // 'he', 'en'
}

export async function generateCampaignContent(data: GenerateContentParams) {
    // Mock AI latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const content: Record<string, string> = {};
    const { description, language } = data;

    // Simple template-based generation for the Pilot
    if (language === 'he') {
        if (data.platforms.includes('whatsapp')) {
            content.whatsapp = `👋 היי! רציתי להמליץ לך על ${description}. \n\nזה בדיוק מה שחיפשת! הנה לינק עם הטבה מיוחדת: [LINK] 🎁`;
        }
        if (data.platforms.includes('instagram')) {
            content.instagram = `✨ גיליתי משהו מדהים: ${description}! \n\nממש שווה בדיקה. לינק בביו! 🔗\n\n#המלצה #טיפ #ישראל #NewFind`;
        }
        if (data.platforms.includes('linkedin')) {
            content.linkedin = `🚀 שמח לשתף שירות מצוין שנתקלתי בו לאחרונה: ${description}.\n\nערך אמיתי ומקצועיות ברמה גבוהה. ממליץ בחום לבדוק! 👇\n\n[LINK]\n\n#חדשנות #עסקים #המלצה #Networking`;
        }
        if (data.platforms.includes('facebook')) {
            content.facebook = `📢 חברים, שימו לב! \n\nנתקלתי ב-${description} והייתי חייב לשתף. זה פתרון מעולה למי שמחפש איכות. \n\nכל הפרטים כאן: [LINK] 👍`;
        }
        if (data.platforms.includes('twitter')) {
            content.twitter = `מצאתי את זה: ${description} 🤯\n\nפשוט עובד. תודו לי אחר כך.\n\n[LINK]\n\n#המלצה #TechIL`;
        }
        if (data.platforms.includes('tiktok')) {
            content.tiktok = `[SCENE: מול מצלמה, התלהבות]\n\n"תקשיבו, אתם לא מאמינים מה מצאתי..."\n\n[CUT: מציג מסך/מוצר]\n\n"${description} - זה משנה את המשחק!"\n\n[SCENE: הצבעה ללינק]\n\n"לינק בביו, רוצו!" 🏃‍♂️💨\n\n#פוריו #טיקטוקישראל #LifeHack`;
        }
        if (data.platforms.includes('email')) {
            content.email = `נושא: המלצה אישית: משהו שיעניין אותך\n\nהיי,\n\nנתקלתי ב-${description} וחשבתי עליך.\n\nמדובר בפתרון שממש עזר לי/הרשים אותי, ובטוח שזה יכול להיות רלוונטי גם עבורך.\n\nאפשר לראות את כל הפרטים כאן: [LINK]\n\nדבר איתי אם יש שאלות!\n\nבברכה,\n[השם שלך]`;
        }
    } else {
        if (data.platforms.includes('whatsapp')) {
            content.whatsapp = `👋 Hey! I wanted to recommend ${description} to you. \n\nCheck it out here, I think you'll love it: [LINK] 🎁`;
        }
        if (data.platforms.includes('instagram')) {
            content.instagram = `✨ Just discovered ${description}! It's a game changer. \n\nLink in bio to verify! 🔗\n\n#Recommendation #MustHave #Tip`;
        }
        if (data.platforms.includes('linkedin')) {
            content.linkedin = `🚀 Excited to share this with my professional network: ${description}.\n\nOutstanding value and execution. Highly recommended! 👇\n\n[LINK]`;
        }
        if (data.platforms.includes('facebook')) {
            content.facebook = `📢 Heads up friends! \n\nI came across ${description} and just had to share. Great solution if you're looking for quality. \n\nDetails here: [LINK] 👍`;
        }
        if (data.platforms.includes('twitter')) {
            content.twitter = `Found this: ${description} 🤯\n\nIt just works. Thank me later.\n\n[LINK]\n\n#Tech #Recommendation`;
        }
        if (data.platforms.includes('tiktok')) {
            content.tiktok = `[SCENE: Talking head, excited]\n\n"Guys, you won't believe what I found..."\n\n[CUT: Showing screen/product]\n\n"${description} - this is a game changer!"\n\n[SCENE: Pointing to link]\n\n"Link in bio, run!" 🏃‍♂️💨\n\n#FYP #TikTokMadeMeBuyIt #LifeHack`;
        }
        if (data.platforms.includes('email')) {
            content.email = `Subject: Personal Recommendation: Check this out\n\nHi,\n\nI came across ${description} and thought of you.\n\nIt's a solution that really impressed me, and I'm sure it could be relevant for you too.\n\nYou can see all the details here: [LINK]\n\nLet me know if you have questions!\n\nBest,\n[Your Name]`;
        }
    }

    return { success: true, content };
}
