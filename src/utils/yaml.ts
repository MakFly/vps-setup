import { parse, stringify } from "yaml";

/**
 * Parse YAML string to object
 */
export function parseYaml<T>(content: string): T | null {
  try {
    return parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify object to YAML
 */
export function toYaml(data: unknown): string {
  return stringify(data, {
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN",
    lineWidth: 0,
  });
}

/**
 * Parse JSON string to object
 */
export function parseJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify object to JSON
 */
export function toJson(data: unknown, pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}
