// Skeleton Loading Components

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
}

export function SkeletonText({ className = '' }: SkeletonProps) {
    return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonAvatar({ className = '' }: SkeletonProps) {
    return <Skeleton className={`h-10 w-10 rounded-full ${className}`} />;
}

export function SkeletonCard() {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <SkeletonText className="w-20" />
                    <SkeletonText className="w-12" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
    return (
        <tr className="border-b border-gray-50">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="py-3 px-4">
                    <SkeletonText className="w-full max-w-[120px]" />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {Array.from({ length: cols }).map((_, i) => (
                                <th key={i} className="py-3 px-4">
                                    <SkeletonText className="w-16" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonTableRow key={i} cols={cols} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <SkeletonText className="w-40 h-6" />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100">
                        <SkeletonText className="w-32 mb-4" />
                        <Skeleton className="h-[250px]" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonLogbookList() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <SkeletonText className="w-40 h-6" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>
                            <SkeletonText className="w-16 mb-1" />
                            <Skeleton className="h-10 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <SkeletonTable rows={5} cols={7} />
        </div>
    );
}

// Driver Dashboard Skeleton (Hero Card + Quick Actions + Recent)
export function SkeletonDriverDashboard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <SkeletonText className="w-48 h-7" />
                <SkeletonText className="w-32 mt-2" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>

            {/* Hero Card */}
            <div className="bg-gray-100 rounded-xl overflow-hidden">
                <Skeleton className="h-28" />
                <div className="bg-white p-4 space-y-4">
                    <SkeletonText className="w-32" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="space-y-1">
                                    <SkeletonText className="w-12" />
                                    <SkeletonText className="w-8 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                        <SkeletonText className="w-32" />
                        <SkeletonText className="w-24" />
                    </div>
                </div>
            </div>

            {/* Recent Logbooks */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                <SkeletonText className="w-32 h-5" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                            <SkeletonText className="w-40" />
                            <SkeletonText className="w-24" />
                        </div>
                        <div className="text-right space-y-1">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <SkeletonText className="w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Driver History Skeleton
export function SkeletonLogbookHistory() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <SkeletonText className="w-48 h-6" />
            </div>

            {/* Logbook Cards */}
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                        <div className="flex justify-between">
                            <div className="space-y-1">
                                <SkeletonText className="w-48" />
                                <SkeletonText className="w-32" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex"><SkeletonText className="w-20 mr-2" /><SkeletonText className="w-32" /></div>
                            <div className="flex"><SkeletonText className="w-20 mr-2" /><SkeletonText className="w-48" /></div>
                        </div>
                        <Skeleton className="h-16 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Management List Skeleton (User, Unit, Etoll, Budget - Legacy)
export function SkeletonManagementList() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <SkeletonText className="w-40 h-6" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>

            {/* Table */}
            <SkeletonTable rows={5} cols={5} />
        </div>
    );
}

// User List Skeleton (Mirrors UserList.tsx)
export function SkeletonUserList() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto" aria-busy="true" aria-label="Memuat data pengguna">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-72 max-w-full rounded" />
                </div>
                <Skeleton className="h-11 w-full sm:w-40 rounded-xl" />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="py-4 px-6 text-left w-1/2"><Skeleton className="h-4 w-32 rounded" /></th>
                            <th className="py-4 px-6 text-left"><Skeleton className="h-4 w-16 rounded" /></th>
                            <th className="py-4 px-6 text-center"><Skeleton className="h-4 w-16 rounded mx-auto" /></th>
                            <th className="py-4 px-6 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3.5">
                                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-4 w-36 rounded" />
                                            <Skeleton className="h-3 w-24 rounded" />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <Skeleton className="h-6 w-20 rounded-md" />
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-3 w-16 rounded mb-1.5" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-end gap-2">
                            <Skeleton className="h-11 w-20 rounded-lg" />
                            <Skeleton className="h-11 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Unit List Skeleton (Mirrors UnitList.tsx)
export function SkeletonUnitList() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto" aria-busy="true" aria-label="Memuat data unit">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-44 rounded-lg" />
                    <Skeleton className="h-4 w-60 max-w-full rounded" />
                </div>
                <Skeleton className="h-11 w-full sm:w-36 rounded-xl" />
            </div>

            {/* Search Bar Area */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Skeleton className="h-10 w-full max-w-md rounded-xl" />
                <Skeleton className="h-6 w-32 rounded-lg self-end sm:self-center" />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            <th className="py-3.5 px-6 text-left w-1/2"><Skeleton className="h-4 w-28 rounded" /></th>
                            <th className="py-3.5 px-6 text-center"><Skeleton className="h-4 w-16 rounded mx-auto" /></th>
                            <th className="py-3.5 px-6 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3.5">
                                        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-4 w-32 rounded" />
                                            <Skeleton className="h-3 w-24 rounded" />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200/70 p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-28 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="border-t border-gray-100" />
                        <div className="flex items-center justify-end gap-2">
                            <Skeleton className="h-11 flex-1 sm:flex-none sm:w-20 rounded-xl" />
                            <Skeleton className="h-11 flex-1 sm:flex-none sm:w-20 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Transaction Logs Skeleton (Mirrors TransactionLogsPage.tsx)
export function SkeletonTransactionLogs() {
    return (
        <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-4" aria-busy="true" aria-label="Memuat riwayat transaksi">
            {/* Header Area */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <Skeleton className="h-4 w-80 max-w-full rounded" />
            </div>

            {/* Segmented Control Tabs & Page Size Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="w-full sm:w-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 flex gap-1">
                    <Skeleton className="h-11 flex-1 sm:w-36 rounded-lg bg-white" />
                    <Skeleton className="h-11 flex-1 sm:w-36 rounded-lg bg-slate-200/70" />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 px-1 sm:px-0">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>

            {/* Logs Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                </div>

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full min-w-[960px]">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                <th className="py-3.5 px-6 text-left w-44"><Skeleton className="h-4 w-28 rounded" /></th>
                                <th className="py-3.5 px-4 text-left"><Skeleton className="h-4 w-24 rounded" /></th>
                                <th className="py-3.5 px-4 text-left"><Skeleton className="h-4 w-16 rounded" /></th>
                                <th className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-20 rounded ml-auto" /></th>
                                <th className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-28 rounded ml-auto" /></th>
                                <th className="py-3.5 px-4 text-left"><Skeleton className="h-4 w-20 rounded" /></th>
                                <th className="py-3.5 px-6 text-left w-60"><Skeleton className="h-4 w-24 rounded" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-6">
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-3 w-16 rounded" />
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24 rounded" />
                                                <Skeleton className="h-3 w-12 rounded" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <Skeleton className="h-4 w-24 rounded ml-auto" />
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <Skeleton className="h-4 w-32 rounded ml-auto" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                                            <Skeleton className="h-3.5 w-16 rounded" />
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-3.5 w-40 rounded" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-100">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 sm:p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28 rounded" />
                                        <Skeleton className="h-3 w-16 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <div className="flex items-center justify-between px-1">
                                <Skeleton className="h-3.5 w-24 rounded" />
                                <Skeleton className="h-3.5 w-24 rounded" />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                                <Skeleton className="h-3.5 w-20 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Monthly Report Skeleton (Mirrors MonthlyReport.tsx)
export function SkeletonMonthlyReport() {
    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-8" aria-busy="true" aria-label="Memuat laporan bulanan">
            {/* Header Area */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <Skeleton className="h-4 w-72 max-w-full rounded" />
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
                <div className="pt-2 flex justify-end">
                    <Skeleton className="h-11 w-full sm:w-44 rounded-xl" />
                </div>
            </div>

            {/* Summary Cards Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-48 rounded" />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-10 w-44 rounded-lg" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                </div>
            </div>

            {/* Tables Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <Skeleton className="h-4 w-36 rounded" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                        </div>
                        <div className="p-4 sm:p-6 space-y-3">
                            {Array.from({ length: 4 }).map((_, r) => (
                                <div key={r} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-32 rounded" />
                                        <Skeleton className="h-3 w-20 rounded" />
                                    </div>
                                    <Skeleton className="h-7 w-20 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Driver Summary Skeleton (Mirrors DriverSummary.tsx)
export function SkeletonDriverSummary() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-6" aria-busy="true" aria-label="Memuat ringkasan driver">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-1.5">
                    <Skeleton className="h-6 w-44 rounded-lg" />
                    <Skeleton className="h-4 w-60 max-w-full rounded" />
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Skeleton className="h-10 flex-1 sm:flex-none sm:w-28 rounded-xl" />
                    <Skeleton className="h-10 flex-1 sm:flex-none sm:w-28 rounded-xl" />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="h-3 w-20 rounded" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full min-w-[760px]">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            <th className="py-3.5 px-4 text-center w-14"><Skeleton className="h-4 w-8 rounded mx-auto" /></th>
                            <th className="py-3.5 px-6 text-left"><Skeleton className="h-4 w-32 rounded" /></th>
                            <th className="py-3.5 px-6 text-center w-32"><Skeleton className="h-4 w-20 rounded mx-auto" /></th>
                            <th className="py-3.5 px-6 text-right w-40"><Skeleton className="h-4 w-24 rounded ml-auto" /></th>
                            <th className="py-3.5 px-6 text-right w-36"><Skeleton className="h-4 w-20 rounded ml-auto" /></th>
                            <th className="py-3.5 px-6 text-right w-44"><Skeleton className="h-4 w-28 rounded ml-auto" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td className="py-4 px-4 text-center">
                                    <Skeleton className="w-6 h-6 rounded mx-auto" />
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                        <Skeleton className="h-4 w-36 rounded" />
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Skeleton className="h-6 w-14 rounded-lg mx-auto" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <Skeleton className="h-4 w-24 rounded ml-auto" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <Skeleton className="h-4 w-20 rounded ml-auto" />
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <Skeleton className="h-5 w-28 rounded ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-14 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 py-1">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-5 w-28 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

