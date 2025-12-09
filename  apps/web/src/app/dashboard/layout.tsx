import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="border-b bg-white px-6 py-4 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl">ReferAI</Link>
                <div className="flex gap-4 text-sm">
                    <Link href="/dashboard/provider" className="hover:text-blue-600">Provider</Link>
                    <Link href="/dashboard/promoter" className="hover:text-blue-600">Promoter</Link>
                    <Link href="/login" className="text-red-500">Logout</Link>
                </div>
            </nav>
            <main className="p-6 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
