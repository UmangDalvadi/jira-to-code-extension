import Header from "../components/Header";
import Tabs from "../components/Tabs";
import Footer from "../components/Footer";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAppContext } from "../context/AppContext";
import { withErrorBoundary } from "../components/ErrorBoundary";
import Workflow from "./Workflow";
import Settings from "./Settings";

const Home = () => {
    const { activeTab, isLoading } = useAppContext();

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" text="Loading..." />
                </div>
            );
        }

        switch (activeTab) {
            case "workflow":
                return <Workflow />;
            case "settings":
                return <Settings />;
            default:
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white mb-2">Welcome to Jira to Code</h2>
                            <p className="text-gray-400">Select a tab to get started</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <Header />
            {/* Tabs */}
            <Tabs />
            {/* Content */}
            <div className="p-6 flex-1">
                {renderContent()}
            </div>
            {/* Footer */}
            <Footer />
        </div>
    );
};

// Wrap with error boundary for additional protection
export default withErrorBoundary(Home);
