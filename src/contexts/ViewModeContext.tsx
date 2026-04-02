import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type ViewMode = 'leader' | 'member' | 'finance' | 'newcomer';

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Initialize from localStorage
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('leaderViewMode');
            return (saved === 'member' || saved === 'leader' || saved === 'finance') ? saved : 'leader';
        }
        return 'leader';
    });

    // Persist to localStorage when it changes
    // Persist to localStorage when it changes
    useEffect(() => {
        if (user?.role === 'leader' || user?.role === 'finance') {
            localStorage.setItem('leaderViewMode', viewMode);
        }
    }, [viewMode, user?.role]);

    // Enforce correct view for non-leaders
    useEffect(() => {
        if (user) {
            if (user.role === 'member' || user.role === 'newcomer') {
                setViewModeState(user.role as ViewMode);
            }
        }
    }, [user?.role]);

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
    };

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (context === undefined) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
}
