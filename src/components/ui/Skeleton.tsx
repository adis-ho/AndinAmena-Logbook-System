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
