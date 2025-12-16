import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { supabase } from '../lib/supabase';
import { ApiService } from '../services/api';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to extract user from session with profile fetch
async function fetchUserWithProfile(sessionUser: { id: string; user_metadata?: Record<string, unknown> }): Promise<User> {
    const metadata = sessionUser.user_metadata || {};

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
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
        console.warn('[AuthContext] Profile fetch failed, using metadata fallback');
    }

    // Fallback to metadata
    return {
        id: sessionUser.id,
        username: (metadata.username as string) || 'user',
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
        let isMounted = true;

        // Check for existing session on mount
        const initSession = async () => {
            console.log('[AuthContext] Checking existing session...');

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && isMounted) {
                    console.log('[AuthContext] Session found for:', session.user.id);
                    const user = await fetchUserWithProfile(session.user);
                    if (isMounted) {
                        setState({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    }
                } else if (isMounted) {
                    console.log('[AuthContext] No session found');
                    setState(s => ({ ...s, isLoading: false }));
                }
            } catch (err) {
                console.error('[AuthContext] Session check error:', err);
                if (isMounted) {
                    setState(s => ({ ...s, isLoading: false }));
                }
            }
        };

        initSession();

        // Listen for auth state changes (excluding INITIAL_SESSION to avoid race condition)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AuthContext] Auth state changed:', event);

            // Skip INITIAL_SESSION as initSession handles it
            if (event === 'INITIAL_SESSION') {
                return;
            }

            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                console.log('[AuthContext] User session updated:', session.user.id);
                // Use non-async approach to avoid race issues
                fetchUserWithProfile(session.user).then(user => {
                    if (isMounted) {
                        setState({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    }
                });
            } else if (event === 'SIGNED_OUT') {
                console.log('[AuthContext] User signed out');
                if (isMounted) {
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            }
        });

        return () => {
            isMounted = false;
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
