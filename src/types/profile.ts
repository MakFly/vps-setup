/**
 * Profile components configuration
 */
export interface ProfileComponents {
  /** Install Docker + Docker Compose */
  docker: boolean;
  /** Install PHP-FPM */
  php_fpm: boolean;
  /** Install Caddy web server */
  caddy: boolean;
  /** Install Node.js (system-wide) */
  nodejs: boolean;
  /** Install NVM (Node Version Manager) */
  nvm: boolean;
  /** Install Bun runtime */
  bun: boolean;
  /** Apply security hardening */
  security: boolean;
}

/**
 * Profile configuration
 */
export interface Profile {
  /** Unique profile name */
  name: string;
  /** Optional description */
  description?: string;
  /** Components to install */
  components: ProfileComponents;
  /** Runtime user for services */
  runtimeUser: string;
  /** Custom Ansible variable overrides */
  overrides?: Record<string, unknown>;
}

/**
 * Profile creation input
 */
export type ProfileInput = Omit<Profile, "overrides"> & {
  overrides?: Record<string, unknown>;
};

/**
 * Profile update input (partial)
 */
export type ProfileUpdate = Partial<Omit<Profile, "name">>;

/**
 * Default profile components (all disabled)
 */
export const DEFAULT_COMPONENTS: ProfileComponents = {
  docker: false,
  php_fpm: false,
  caddy: false,
  nodejs: false,
  nvm: false,
  bun: false,
  security: false,
};

/**
 * Full-stack profile components
 */
export const FULL_STACK_COMPONENTS: ProfileComponents = {
  docker: true,
  php_fpm: true,
  caddy: true,
  nodejs: true,
  nvm: false,
  bun: true,
  security: true,
};

/**
 * Minimal profile components (Docker + Security only)
 */
export const MINIMAL_COMPONENTS: ProfileComponents = {
  docker: true,
  php_fpm: false,
  caddy: false,
  nodejs: false,
  nvm: false,
  bun: false,
  security: true,
};

/**
 * Security-only profile components
 */
export const SECURITY_ONLY_COMPONENTS: ProfileComponents = {
  docker: false,
  php_fpm: false,
  caddy: false,
  nodejs: false,
  nvm: false,
  bun: false,
  security: true,
};
