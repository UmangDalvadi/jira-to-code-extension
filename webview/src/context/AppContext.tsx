import React, { createContext, useContext, useState } from "react";

// Add more global states here as needed
type Tab = "dashboard" | "workflow" | "settings";

interface AppContextType {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTab, setActiveTab] = useState<Tab>("workflow");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const value: AppContextType = {
        activeTab,
        setActiveTab,
        isLoading,
        setIsLoading,
        error,
        setError,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};
