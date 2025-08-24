import {
    CheckCircle,
    Code,
    Database,
    ExternalLink,
    GitBranch,
    Loader,
    Play,
    TestTube,
} from "lucide-react";
import { useState } from "react";
import { postMessage } from "../lib/vscodeBridge";

// Define message types locally for development
enum FromWebview {
    SendJiraUrl = "sendJiraUrl",
}

const Workflow = () => {
    const [jiraUrl, setJiraUrl] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    // const [progress, setProgress] = useState(0);

    // const handleJiraSubmit = async () => {
    //     if (!jiraUrl.trim()) {
    //         addLog('Please enter a valid Jira ticket URL', 'error');
    //         return;
    //     }

    //     setIsProcessing(true);
    //     setProgress(0);

    //     First, check if we have valid tokens
    //     addLog('Checking authentication status...', 'info');

    //     try {
    //         // Send message to extension to check token validity
    //         if (typeof vscode !== 'undefined') {
    //             vscode.postMessage({
    //                 type: 'checkAndProcessJira',
    //                 payload: { jiraUrl }
    //             });
    //         } else {
    //             // Fallback for development - simulate token check
    //             await new Promise(resolve => setTimeout(resolve, 1000));

    //             if (!jiraAuth.isConnected) {
    //                 addLog('No valid authentication found. Redirecting to OAuth...', 'warning');
    //                 await new Promise(resolve => setTimeout(resolve, 500));
    //                 handleJiraConnect();
    //                 setIsProcessing(false);
    //                 return;
    //             }

    //             // Continue with normal workflow if authenticated
    //             await processJiraWorkflow();
    //         }
    //     } catch (error) {
    //         addLog('Failed to process Jira ticket', 'error');
    //         setIsProcessing(false);
    //     }
    // };

    const handleJiraSubmit = async () => {
        setIsProcessing(true);

        // Validate Jira URL format
        postMessage(FromWebview.SendJiraUrl, { jiraUrl });

        setIsProcessing(false);
    };

    return (
        <div>
            <div className="space-y-6">
                {/* Quick Start */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Play size={20} />
                        Start New Workflow
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Jira Ticket URL
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={jiraUrl}
                                    onChange={e => setJiraUrl(e.target.value)}
                                    placeholder="https://yourcompany.atlassian.net/browse/DEV-123"
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isProcessing}
                                />
                                <button
                                    onClick={handleJiraSubmit}
                                    disabled={isProcessing}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    {isProcessing ? (
                                        <Loader className="animate-spin" size={16} />
                                    ) : (
                                        <Play size={16} />
                                    )}
                                    {isProcessing ? "Processing..." : "Start"}
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                🚀 Just paste your Jira URL and hit start! We'll handle
                                authentication automatically.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        {/* {isProcessing && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )} */}
                    </div>
                </div>

                {/* Workflow Steps */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4">Workflow Steps</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Database,
                                title: "Fetch & Parse",
                                desc: "Extract requirements from Jira",
                            },
                            {
                                icon: Code,
                                title: "Generate Code",
                                desc: "AI-powered code generation",
                            },
                            {
                                icon: TestTube,
                                title: "Create Tests",
                                desc: "Automated test creation",
                            },
                            {
                                icon: CheckCircle,
                                title: "Validate Coverage",
                                desc: "Ensure quality standards",
                            },
                            {
                                icon: GitBranch,
                                title: "Git Automation",
                                desc: "Branch and PR creation",
                            },
                            {
                                icon: ExternalLink,
                                title: "Update Jira",
                                desc: "Status and progress tracking",
                            },
                        ].map((step, index) => (
                            <div key={index} className="p-4 bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <step.icon size={16} />
                                    </div>
                                    <h3 className="font-medium">{step.title}</h3>
                                </div>
                                <p className="text-gray-400 text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Logs */}
                {/* <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity size={18} />
                            Live Logs
                        </h2>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                No logs yet. Start a workflow to see activity.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <LogEntry key={index} log={log} />
                                ))}
                            </div>
                        )}
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default Workflow;
