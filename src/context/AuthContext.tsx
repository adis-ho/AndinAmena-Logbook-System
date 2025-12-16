import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { supabase } from '../lib/supabase';
import { ApiService } from '../services/api';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to extract user from session without additional API calls
function getUserFromSession(sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
    const metadata = sessionUser.user_metadata || {};
    return {
        id: sessionUser.id,
        username: (metadata.username as string) || sessionUser.email?.split('@')[0] || 'user',
        full_name: (metadata.full_name as string) || 'User',
        role: (metadata.role as User['role']) || 'driver',
        status: 'active'
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        // Check for existing session on mount
        const initSession = async () => {
            console.log('[AuthContext] Checking existing session...');
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                console.log('[AuthContext] Session found for:', session.user.id);
                const user = getUserFromSession(session.user);
                setState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                console.log('[AuthContext] No session found');
                setState(s => ({ ...s, isLoading: false }));
            }
        };

        initSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AuthContext] Auth state changed:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('[AuthContext] User signed in:', session.user.id);
                const user = getUserFromSession(session.user);
                setState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else if (event === 'SIGNED_OUT') {
                console.log('[AuthContext] User signed out');
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        console.log('[AuthContext] Login attempt for:', email);
        const user = await ApiService.login(email, password);
        if (user) {
            console.log('[AuthContext] Login successful for:', user.id);
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
            return true;
        }
        console.log('[AuthContext] Login failed');
        return false;
    };

    const logout = async () => {
        console.log('[AuthContext] Logging out...');
        await ApiService.logout();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
