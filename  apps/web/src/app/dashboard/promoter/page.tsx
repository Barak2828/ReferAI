import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PromoterDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Promoter Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">My Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪ 1,250</div>
                        <p className="text-xs text-muted-foreground">Pending payout</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">2.3% conversion rate</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8">Available Campaigns</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span>Summer Sale 2025</span>
                                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">10% Comm.</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Promote our summer collection and earn 10% on every sale.
                            </p>
                            <div className="space-y-2">
                                <Button className="w-full" size="sm">Generate Link</Button>
                                <Button variant="outline" className="w-full" size="sm">View AI Content</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
