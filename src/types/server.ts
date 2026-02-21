/**
 * Server configuration type
 */
export interface Server {
  /** Unique server name identifier */
  name: string;
  /** Host IP address or hostname */
  host: string;
  /** SSH user */
  user: string;
  /** SSH port */
  port?: number;
  /** Operating system type */
  os?: "debian" | "ubuntu" | "auto";
  /** Tags for organization */
  tags?: string[];
  /** Path to SSH private key */
  sshKey?: string;
  /** Optional notes */
  notes?: string;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last provisioning timestamp (ISO string) */
  lastProvisioned?: string;
}

/**
 * Server creation input (without auto-generated fields)
 */
export type ServerInput = Omit<Server, "createdAt" | "lastProvisioned">;

/**
 * Server update input (partial)
 */
export type ServerUpdate = Partial<Omit<Server, "name" | "createdAt">>;

/**
 * Default server values
 */
export const DEFAULT_SERVER: Omit<Server, "name" | "host" | "user" | "createdAt"> = {
  port: 22,
  os: "auto",
  tags: [],
};
