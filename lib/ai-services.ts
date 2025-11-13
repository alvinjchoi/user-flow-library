/**
 * AI Service Layer
 * Centralized service for AI-powered features
 */

export interface ScreenAnalysis {
  title: string;
  displayName: string;
  description: string;
}

export interface DetectedElement {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elementType: string;
  label: string;
  description?: string;
  confidence?: number;
}

export interface ElementDetectionResult {
  elements: DetectedElement[];
  count: number;
  raw_count: number;
  method: "screencoder" | "uied" | "gpt4" | "fallback";
  warning?: string;
}

/**
 * Service class for AI-powered features
 */
export class AIService {
  /**
   * Analyzes a screenshot and returns suggested title, displayName, and description
   * 
   * @param imageUrl - URL or data URL of the screenshot to analyze
   * @returns Promise with screen analysis result
   * @throws Error if analysis fails
   */
  static async analyzeScreenshot(imageUrl: string): Promise<ScreenAnalysis> {
    const response = await fetch("/api/analyze-screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `AI analysis failed with status ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Detects interactive UI elements (hotspots) in a screen screenshot
   * 
   * @param screenId - ID of the screen to analyze
   * @returns Promise with detected elements
   * @throws Error if detection fails
   */
  static async detectElements(
    screenId: string
  ): Promise<ElementDetectionResult> {
    const response = await fetch(`/api/screens/${screenId}/detect-elements`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Element detection failed with status ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Checks if AI analysis is available (API key configured)
   */
  static isAvailable(): boolean {
    // This should be checked on the server side, but we can provide a client-side hint
    // The actual availability will be determined by the API routes
    return true; // Always return true, let the API handle the actual check
  }

  /**
   * Gets a user-friendly error message for AI service errors
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("API key")) {
        return "AI service is not configured. Please contact support.";
      }
      if (error.message.includes("rate limit")) {
        return "AI service is temporarily unavailable. Please try again later.";
      }
      if (error.message.includes("timeout")) {
        return "AI analysis timed out. Please try with a smaller image.";
      }
      return error.message;
    }
    return "An unexpected error occurred during AI analysis.";
  }
}

/**
 * React hook for analyzing screenshots (optional, for easier integration)
 * Usage in components:
 * 
 * const { analyze, analyzing, error } = useScreenshotAnalysis();
 * const result = await analyze(imageUrl);
 */
export function useScreenshotAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (imageUrl: string): Promise<ScreenAnalysis | null> => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await AIService.analyzeScreenshot(imageUrl);
      return result;
    } catch (err) {
      const errorMessage = AIService.getErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyze, analyzing, error };
}

/**
 * React hook for detecting UI elements
 */
export function useElementDetection() {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async (
    screenId: string
  ): Promise<ElementDetectionResult | null> => {
    setDetecting(true);
    setError(null);
    try {
      const result = await AIService.detectElements(screenId);
      return result;
    } catch (err) {
      const errorMessage = AIService.getErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setDetecting(false);
    }
  };

  return { detect, detecting, error };
}

// Import useState for hooks (only if used in client components)
import { useState } from "react";

