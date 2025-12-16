import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../NotificationPanel';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shadow-sm">
            {/* Left: Menu Button & Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-gray-900">
                        {user?.role === 'admin' ? 'Admin Panel' : 'Driver Portal'}
                    </h1>
                </div>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-3">
                {/* Notification Panel */}
                <NotificationPanel />

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
