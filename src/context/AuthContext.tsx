import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { supabase } from '../lib/supabase';
import { ApiService } from '../services/api';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        // Helper to fetch user profile from database
        const fetchUserProfile = async (userId: string, fallbackMetadata: Record<string, unknown> = {}): Promise<User> => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    return {
                        id: profile.id,
                        username: profile.username,
                        full_name: profile.full_name,
                        role: profile.role as User['role'],
                        status: profile.status || 'active'
                    };
                }
            } catch (err) {
                console.warn('[AuthContext] Profile fetch failed:', err);
            }

            // Fallback to metadata
            return {
                id: userId,
                username: (fallbackMetadata.username as string) || 'user',
                full_name: (fallbackMetadata.full_name as string) || 'User',
                role: (fallbackMetadata.role as User['role']) || 'driver',
                status: 'active'
            };
        };

        // Check for existing session on mount
        const initSession = async () => {
            console.log('[AuthContext] Checking existing session...');
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                console.log('[AuthContext] Session found for:', session.user.id);
                const user = await fetchUserProfile(session.user.id, session.user.user_metadata || {});
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event);

            // Handle events that should update user state
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
                console.log('[AuthContext] User session active:', session.user.id);
                const user = await fetchUserProfile(session.user.id, session.user.user_metadata || {});
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
