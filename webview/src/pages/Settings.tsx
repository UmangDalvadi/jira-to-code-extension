import { Settings as SettingsIcon, ExternalLink, Users, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { useState } from "react";

interface UserInfo {
    displayName: string;
    accountId: string;
}

interface JiraAuthState {
    isConnected: boolean;
    userInfo: UserInfo | null;
    isLoading: boolean;
    error: string | null;
}

const Settings = () => {
    const [jiraAuth, setJiraAuth] = useState<JiraAuthState>({
        isConnected: false,
        userInfo: null,
        isLoading: false,
        error: null
    });

    const [config, setConfig] = useState({
        testCoverage: 80,
        autoCreatePR: true,
        updateJiraStatus: true,
        llmModel: 'gemini',
        codeLanguage: 'typescript'
    });

    const handleJiraConnect = () => {
        setJiraAuth(prev => ({ ...prev, isLoading: true, error: null }));
        // Simulate connection in development
        setTimeout(() => {
            setJiraAuth({
                isConnected: true,
                userInfo: { displayName: 'Demo User', accountId: 'demo123' },
                isLoading: false,
                error: null
            });
        }, 2000);
    };

    const handleJiraDisconnect = () => {
        setJiraAuth({
            isConnected: false,
            userInfo: null,
            isLoading: false,
            error: null
        });
    };

    return (
        <div className="space-y-6">
            {/* Jira Authentication */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink size={20} />
                    Jira Authentication
                </h2>

                {!jiraAuth.isConnected ? (
                    <div className="space-y-4">
                        <p className="text-gray-400">
                            Connect your Jira account to start processing tickets automatically.
                        </p>

                        {jiraAuth.error && (
                            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <span className="text-red-400 text-sm">{jiraAuth.error}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleJiraConnect}
                                disabled={jiraAuth.isLoading}
                                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors font-medium flex-1"
                            >
                                {jiraAuth.isLoading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink size={20} />
                                        Connect to Jira
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle size={20} className="text-green-400" />
                                <h3 className="font-medium text-green-400">Connected to Jira</h3>
                            </div>
                            {jiraAuth.userInfo && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-gray-400" />
                                        <span className="text-gray-300">{jiraAuth.userInfo.displayName || 'User'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ExternalLink size={16} className="text-gray-400" />
                                        <span className="text-gray-300">{jiraAuth.userInfo.accountId || 'Connected'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => console.log('Testing connection...')}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                            >
                                Test Connection
                            </button>
                            <button
                                onClick={handleJiraDisconnect}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Configuration Settings */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <SettingsIcon size={20} />
                    Configuration
                </h2>
                
                <div className="space-y-6">
                    {/* Test Coverage */}
                    <div>
                        <label htmlFor="test-coverage" className="block text-sm font-medium mb-2">
                            Minimum Test Coverage ({config.testCoverage}%)
                        </label>
                        <input
                            id="test-coverage"
                            type="range"
                            min="50"
                            max="100"
                            value={config.testCoverage}
                            onChange={(e) => setConfig({ ...config, testCoverage: parseInt(e.target.value) })}
                            className="w-full"
                            title={`Test coverage: ${config.testCoverage}%`}
                        />
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* LLM Model Selection */}
                    <div>
                        <label htmlFor="llm-model" className="block text-sm font-medium mb-2">AI Model</label>
                        <select
                            id="llm-model"
                            value={config.llmModel}
                            onChange={(e) => setConfig({ ...config, llmModel: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Select AI model"
                        >
                            <option value="gemini">Gemini Pro</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="claude">Claude</option>
                        </select>
                    </div>

                    {/* Code Language */}
                    <div>
                        <label htmlFor="code-language" className="block text-sm font-medium mb-2">Preferred Language</label>
                        <select
                            id="code-language"
                            value={config.codeLanguage}
                            onChange={(e) => setConfig({ ...config, codeLanguage: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Select preferred programming language"
                        >
                            <option value="typescript">TypeScript</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    {/* Toggle Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Auto Create Pull Request</h3>
                                <p className="text-gray-400 text-sm">Automatically create PR after code generation</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.autoCreatePR}
                                    onChange={(e) => setConfig({ ...config, autoCreatePR: e.target.checked })}
                                    className="sr-only peer"
                                    title="Toggle auto create pull request"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Update Jira Status</h3>
                                <p className="text-gray-400 text-sm">Automatically update ticket status after completion</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.updateJiraStatus}
                                    onChange={(e) => setConfig({ ...config, updateJiraStatus: e.target.checked })}
                                    className="sr-only peer"
                                    title="Toggle update Jira status"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    Reset to Defaults
                </button>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Save Configuration
                </button>
            </div>
        </div>
    );
};

export default Settings;
