import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState } from '../types';
import { MockService } from '../services/mockData';

interface AuthContextType extends AuthState {
    login: (username: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        // Check localStorage
        const storedUser = localStorage.getItem('amena_user');
        if (storedUser) {
            setState({
                user: JSON.parse(storedUser),
                isAuthenticated: true,
                isLoading: false,
            });
        } else {
            setState(s => ({ ...s, isLoading: false }));
        }
    }, []);

    const login = async (username: string) => {
        const user = await MockService.login(username);
        if (user) {
            localStorage.setItem('amena_user', JSON.stringify(user));
            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('amena_user');
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
