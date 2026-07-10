import { v4 as uuidv4 } from "uuid";

export interface LogContext {
  correlationId: string;
  resourceId?: string;
  userId?: string;
  eventType?: string;
  processingTime?: number;
  status?: string;
}

export function createLogContext(headers: any, defaults: Partial<LogContext> = {}): LogContext {
  const requestId = headers ? (headers["x-request-id"] || headers["X-Request-Id"]) : undefined;
  return {
    correlationId: (Array.isArray(requestId) ? requestId[0] : requestId) || uuidv4(),
    ...defaults
  };
}

export function logInfo(context: LogContext, message: string, ...args: any[]) {
  const meta = `[correlationId: ${context.correlationId}] [resourceId: ${context.resourceId || "N/A"}] [userId: ${context.userId || "N/A"}] [eventType: ${context.eventType || "N/A"}] [processingTime: ${context.processingTime !== undefined ? context.processingTime + "ms" : "N/A"}] [status: ${context.status || "N/A"}]`;
  console.log(`[INFO] ${meta} - ${message}`, ...args);
}

export function logWarn(context: LogContext, message: string, ...args: any[]) {
  const meta = `[correlationId: ${context.correlationId}] [resourceId: ${context.resourceId || "N/A"}] [userId: ${context.userId || "N/A"}] [eventType: ${context.eventType || "N/A"}] [processingTime: ${context.processingTime !== undefined ? context.processingTime + "ms" : "N/A"}] [status: ${context.status || "N/A"}]`;
  console.warn(`[WARN] ${meta} - ${message}`, ...args);
}

export function logError(context: LogContext, message: string, ...args: any[]) {
  const meta = `[correlationId: ${context.correlationId}] [resourceId: ${context.resourceId || "N/A"}] [userId: ${context.userId || "N/A"}] [eventType: ${context.eventType || "N/A"}] [processingTime: ${context.processingTime !== undefined ? context.processingTime + "ms" : "N/A"}] [status: ${context.status || "N/A"}]`;
  console.error(`[ERROR] ${meta} - ${message}`, ...args);
}
