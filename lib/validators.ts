/**
 * Validation utilities for API request data
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates a bounding box for hotspots/UI elements
 * All values should be percentages (0-100)
 * 
 * @throws ValidationError if validation fails
 */
export function validateBoundingBox(box: Partial<BoundingBox>): BoundingBox {
  const { x, y, width, height } = box;

  // Check if all fields are present
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    throw new ValidationError(
      "boundingBox",
      "Missing required bounding box fields (x, y, width, height)"
    );
  }

  // Validate individual values are in range
  const fields = [
    { value: x, name: "x_position" },
    { value: y, name: "y_position" },
    { value: width, name: "width" },
    { value: height, name: "height" },
  ];

  for (const { value, name } of fields) {
    if (value < 0 || value > 100) {
      throw new ValidationError(
        name,
        `${name} must be between 0 and 100 (got ${value})`
      );
    }
  }

  // Check if box exceeds image bounds
  if (x + width > 100) {
    throw new ValidationError(
      "boundingBox",
      `Bounding box exceeds right boundary (x: ${x}, width: ${width}, total: ${x + width})`
    );
  }

  if (y + height > 100) {
    throw new ValidationError(
      "boundingBox",
      `Bounding box exceeds bottom boundary (y: ${y}, height: ${height}, total: ${y + height})`
    );
  }

  // Check minimum size (at least 0.1% to avoid invisible hotspots)
  if (width < 0.1) {
    throw new ValidationError("width", "Width must be at least 0.1%");
  }
  if (height < 0.1) {
    throw new ValidationError("height", "Height must be at least 0.1%");
  }

  return { x, y, width, height };
}

/**
 * Checks if a bounding box is valid without throwing
 * Returns true if valid, false otherwise
 */
export function isValidBoundingBox(box: Partial<BoundingBox>): boolean {
  try {
    validateBoundingBox(box);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates an array of detected elements with bounding boxes
 * Filters out invalid elements and returns only valid ones
 */
export interface DetectedElement {
  boundingBox: BoundingBox;
  [key: string]: any;
}

export function filterValidElements<T extends { boundingBox: Partial<BoundingBox> }>(
  elements: T[]
): T[] {
  return elements.filter((element) => {
    try {
      validateBoundingBox(element.boundingBox);
      return true;
    } catch (error) {
      console.warn(
        `[Validator] Filtered out invalid element:`,
        element,
        error instanceof ValidationError ? error.message : error
      );
      return false;
    }
  });
}

/**
 * Validates that a string is not empty after trimming
 */
export function validateNonEmptyString(
  value: string | undefined | null,
  fieldName: string
): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(fieldName, `${fieldName} cannot be empty`);
  }
  return value.trim();
}

/**
 * Validates that a value is a valid UUID
 */
export function validateUUID(value: string | undefined | null, fieldName: string): string {
  if (!value) {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new ValidationError(fieldName, `${fieldName} must be a valid UUID`);
  }

  return value;
}

/**
 * Validates file upload constraints
 */
export function validateImageFile(file: File): void {
  // Check file type
  if (!file.type.startsWith("image/")) {
    throw new ValidationError("file", "File must be an image");
  }

  // Check file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new ValidationError(
      "file",
      `File size must be less than 10MB (got ${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
  }
}

