import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ProviderDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Provider Dashboard</h1>
                <Link href="/dashboard/provider/campaigns/new">
                    <Button>+ Create Campaign</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪ 450</div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8">Active Campaigns</h2>
            <Card>
                <CardContent className="p-0">
                    <div className="border-b p-4 grid grid-cols-4 font-medium text-sm text-muted-foreground">
                        <div>Campaign Name</div>
                        <div>Status</div>
                        <div>Leads</div>
                        <div>Actions</div>
                    </div>
                    <div className="p-4 grid grid-cols-4 items-center text-sm">
                        <div className="font-medium">Summer Sale 2025</div>
                        <div className="text-green-600">Active</div>
                        <div>8</div>
                        <Button variant="outline" size="sm">View</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
