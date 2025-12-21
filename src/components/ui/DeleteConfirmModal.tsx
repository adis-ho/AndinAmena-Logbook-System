import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    warningText?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    warningText,
    confirmText = "Ya, hapus permanen",
    cancelText = "Tidak, batalkan",
    loading = false
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6 text-center text-base">
                        {description}
                    </p>

                    {/* Warning Box */}
                    {warningText && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800 mb-1">Peringatan</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    {warningText}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {loading ? (
                                <span>Memproses...</span>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
