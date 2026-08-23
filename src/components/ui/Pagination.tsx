import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Select from './Select';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export default function Pagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100]
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                Menampilkan <span className="text-gray-900 tabular-nums">{startItem}</span> &ndash; <span className="text-gray-900 tabular-nums">{endItem}</span> dari <span className="text-gray-900 tabular-nums">{totalItems}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="w-32">
                    <Select
                        value={String(pageSize)}
                        onChange={(val) => onPageSizeChange(Number(val))}
                        position="top"
                        options={pageSizeOptions.map(option => ({
                            value: String(option),
                            label: `${option} / page`
                        }))}
                    />
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all duration-200"
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {typeof page === 'number' ? (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`h-8 min-w-[32px] px-2 flex items-center justify-center rounded-lg text-sm font-black transition-all duration-300 ${currentPage === page
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border-transparent hover:bg-blue-700 hover:-translate-y-0.5'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span className="px-1 text-gray-400 font-bold tracking-widest text-xs h-8 flex items-end pb-1" aria-hidden="true">
                                    {page}
                                </span>
                            )}
                        </React.Fragment>
                    ))}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all duration-200"
                        aria-label="Halaman selanjutnya"
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
