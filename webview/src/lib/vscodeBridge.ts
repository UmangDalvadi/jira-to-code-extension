type VSCodeMessage = { type: string; payload?: any };

// Check if we're running inside VS Code or in development mode
const isVSCodeEnvironment = typeof acquireVsCodeApi !== 'undefined';
const vscode = isVSCodeEnvironment ? acquireVsCodeApi() : null;

export function postMessage(type: string, payload?: any) {
    if (vscode) {
        vscode.postMessage({ type, payload });
    } else {
        // In development mode, just log the message
        console.log('VS Code message (dev mode):', { type, payload });
    }
}

export function subscribeMessage(handler: (msg: VSCodeMessage) => void) {
    const cb = (ev: MessageEvent) => handler(ev.data);
    window.addEventListener("message", cb);
    return () => window.removeEventListener("message", cb);
}
