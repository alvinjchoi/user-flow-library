import { useState, useCallback } from "react";
import {
  createScreen,
  updateScreen,
  deleteScreen,
  createFlow,
  deleteFlow,
  updateFlow,
  reorderScreens,
  reorderFlows,
} from "@/lib/flows";
import { uploadScreenshot } from "@/lib/storage";
import type { Screen, Flow } from "@/lib/database.types";

export interface UseScreenActionsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing screen CRUD operations
 */
export function useScreenActions(options: UseScreenActionsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAddScreen = useCallback(
    async (
      flowId: string,
      title: string,
      parentId?: string,
      screenshotFile?: File
    ): Promise<Screen | null> => {
      setLoading(true);
      setError(null);

      try {
        // Create the screen
        const newScreen = await createScreen(flowId, title, parentId);

        // Upload screenshot if provided
        if (screenshotFile) {
          const screenshotUrl = await uploadScreenshot(
            screenshotFile,
            newScreen.id
          );
          if (screenshotUrl) {
            await updateScreen(newScreen.id, {
              screenshot_url: screenshotUrl,
            });
          }
        }

        options.onSuccess?.();
        return newScreen;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to add screen");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleUpdateScreen = useCallback(
    async (screenId: string, updates: Partial<Screen>): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await updateScreen(screenId, updates);
        options.onSuccess?.();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update screen");
        setError(error);
        options.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleDeleteScreen = useCallback(
    async (screenId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await deleteScreen(screenId);
        options.onSuccess?.();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete screen");
        setError(error);
        options.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleUploadScreenshot = useCallback(
    async (screenId: string, file: File): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const screenshotUrl = await uploadScreenshot(file, screenId);
        if (screenshotUrl) {
          await updateScreen(screenId, { screenshot_url: screenshotUrl });
          options.onSuccess?.();
        }
        return screenshotUrl;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to upload screenshot");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    handleAddScreen,
    handleUpdateScreen,
    handleDeleteScreen,
    handleUploadScreenshot,
    loading,
    error,
  };
}

/**
 * Custom hook for managing flow CRUD operations
 */
export function useFlowActions(options: UseScreenActionsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAddFlow = useCallback(
    async (
      projectId: string,
      name: string,
      description?: string,
      parentScreenId?: string,
      parentFlowId?: string
    ): Promise<Flow | null> => {
      setLoading(true);
      setError(null);

      try {
        const newFlow = await createFlow(
          projectId,
          name,
          description,
          parentScreenId,
          parentFlowId
        );
        options.onSuccess?.();
        return newFlow;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to add flow");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleUpdateFlow = useCallback(
    async (flowId: string, updates: Partial<Flow>): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await updateFlow(flowId, updates);
        options.onSuccess?.();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update flow");
        setError(error);
        options.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleDeleteFlow = useCallback(
    async (flowId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await deleteFlow(flowId);
        options.onSuccess?.();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete flow");
        setError(error);
        options.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const handleReorderFlows = useCallback(
    async (
      flows: { id: string; order_index: number }[]
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await reorderFlows(flows);
        options.onSuccess?.();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to reorder flows");
        setError(error);
        options.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    handleAddFlow,
    handleUpdateFlow,
    handleDeleteFlow,
    handleReorderFlows,
    loading,
    error,
  };
}

