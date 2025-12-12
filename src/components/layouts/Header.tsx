import { Menu, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
                <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 flex justify-end items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <UserCircle className="h-6 w-6" />
                </div>
            </div>
        </header>
    );
}
