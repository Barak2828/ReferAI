import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-50">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4">
                    ReferAI - MVP Core
                </p>
                <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:h-auto lg:w-auto lg:bg-none">
                    <Link href="/login">
                        <Button>Sign In / Get Started</Button>
                    </Link>
                </div>
            </div>

            <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
                <h1 className="text-6xl font-bold text-center text-slate-900">
                    Turn Your Network <br />
                    <span className="text-blue-600">Into Revenue</span>
                </h1>
            </div>

            <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>AI Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        Generate high-converting posts, carousels, and messages in seconds.
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Track Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        Transparent tracking for every click, lead, and closed deal.
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Get Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        Simple commission management and payouts for your network.
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
