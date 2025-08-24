import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppRoutes from './routes/Routes';
import { globalErrorHandler } from './utils/errorHandler';
import "./App.css";

export default function App() {
    return (
        <ErrorBoundary
            onError={(error) => {
                // Log React errors to our error handler
                globalErrorHandler.handle(error, 'React Error Boundary');
            }}
        >
            <ToastProvider>
                <AppProvider>
                    <AppRoutes />
                </AppProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
}
