
export interface AzugaCampaign {
    id: string; // Internal Azuga ID
    name: string;
    description: string;
    payout_amount: number;
    payout_type: 'fixed' | 'percentage';
    landing_url: string;
}

export const MOCK_AZUGA_CAMPAIGNS: AzugaCampaign[] = [
    {
        id: "crm_101",
        name: "Auto Insurance Q4 Special",
        description: "High-converting auto insurance funnel for Q4. Target audience: Vehicle owners aged 25-50.",
        payout_amount: 50,
        payout_type: 'fixed',
        landing_url: "https://azuga.com/promo/auto-q4"
    },
    {
        id: "crm_102",
        name: "Home Security Bundle",
        description: " comprehensive home security package. Great for homeowners in suburban areas.",
        payout_amount: 120,
        payout_type: 'fixed',
        landing_url: "https://azuga.com/promo/secure-home"
    },
    {
        id: "crm_103",
        name: "Small Business Loan",
        description: "Quick approval loans for SMEs. High ticket item with percentage commission.",
        payout_amount: 1.5, // 1.5%
        payout_type: 'percentage',
        landing_url: "https://azuga.com/promo/biz-loan"
    }
];

export async function fetchMockAzugaCampaigns(): Promise<AzugaCampaign[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_AZUGA_CAMPAIGNS;
}
