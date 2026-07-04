/**
 * src/lib/errorReporter.ts
 *
 * Ye module website ke har JS error, promise rejection, aur React
 * component crash ko capture karke agent server ko bhejta hai.
 */

const AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || "http://localhost:4000/api/report-error";

interface ErrorReport {
  type: "js-error" | "promise-rejection" | "react-error" | "manual-report";
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string | null;
  componentName?: string;
}

function sendReport(payload: ErrorReport) {
  try {
    fetch(AGENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    // agent khud crash na ho, isliye silently ignore
  }
}

export function initErrorReporting() {
  window.addEventListener("error", (event) => {
    sendReport({
      type: "js-error",
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    sendReport({
      type: "promise-rejection",
      message: event.reason ? String(event.reason.message || event.reason) : "Unknown rejection",
      stack: event.reason && event.reason.stack ? event.reason.stack : null,
    });
  });
}

export function reportReactError(componentName: string, error: Error, componentStack: string | null) {
  sendReport({
    type: "react-error",
    message: error.message,
    stack: error.stack || componentStack || null,
    componentName,
  });
}

export function reportBugManually(description: string) {
  sendReport({
    type: "manual-report",
    message: description,
  });
}
