import { execa } from "execa";
import type { Server } from "@/types/index.ts";
import { debug, error } from "@/utils/index.ts";

/**
 * SSH test result
 */
export interface SSHTestResult {
  success: boolean;
  os?: string;
  version?: string;
  error?: string;
  duration: number;
}

/**
 * Test SSH connection to a server
 */
export async function testSSHConnection(server: Server): Promise<SSHTestResult> {
  const startTime = Date.now();

  const sshArgs = buildSSHArgs(server, "echo 'SSH_OK'");

  try {
    debug(`Testing SSH connection to ${server.host}...`);

    const result = await execa("ssh", sshArgs, {
      timeout: 30000, // 30 seconds timeout
    });

    if (result.stdout.includes("SSH_OK")) {
      // Try to detect OS
      const osInfo = await detectOS(server);

      return {
        success: true,
        os: osInfo.os,
        version: osInfo.version,
        duration: Date.now() - startTime,
      };
    }

    return {
      success: false,
      error: "Unexpected response from server",
      duration: Date.now() - startTime,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`SSH connection failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Detect OS on remote server
 */
export async function detectOS(server: Server): Promise<{ os: string; version: string }> {
  try {
    // Try /etc/os-release first
    const cmd = "cat /etc/os-release 2>/dev/null || cat /etc/lsb-release 2>/dev/null";
    const sshArgs = buildSSHArgs(server, cmd);

    const result = await execa("ssh", sshArgs, { timeout: 10000 });
    const output = result.stdout;

    // Parse OS info
    const idMatch = output.match(/^ID=(.+)$/m);
    const versionMatch = output.match(/^VERSION_ID="?([^"\n]+)"?/m);

    if (idMatch) {
      return {
        os: idMatch[1].trim().toLowerCase(),
        version: versionMatch?.[1] || "unknown",
      };
    }

    // Fallback to uname
    const unameArgs = buildSSHArgs(server, "uname -a");
    const unameResult = await execa("ssh", unameArgs, { timeout: 10000 });

    if (unameResult.stdout.toLowerCase().includes("debian")) {
      return { os: "debian", version: "unknown" };
    }
    if (unameResult.stdout.toLowerCase().includes("ubuntu")) {
      return { os: "ubuntu", version: "unknown" };
    }

    return { os: "linux", version: "unknown" };
  } catch {
    return { os: "linux", version: "unknown" };
  }
}

/**
 * Build SSH arguments for a command
 */
export function buildSSHArgs(server: Server, command: string): string[] {
  const args: string[] = [];

  // SSH options
  args.push("-o", "StrictHostKeyChecking=accept-new");
  args.push("-o", "ConnectTimeout=10");
  args.push("-o", "BatchMode=yes");

  // Port
  if (server.port) {
    args.push("-p", String(server.port));
  }

  // SSH key
  if (server.sshKey) {
    args.push("-i", server.sshKey);
  }

  // User@Host
  args.push(`${server.user}@${server.host}`);

  // Command
  args.push(command);

  return args;
}

/**
 * Build SSH tunnel command for Ansible
 */
export function buildSSHTunnelOptions(server: Server): string[] {
  const options: string[] = [];

  if (server.port && server.port !== 22) {
    options.push(`-o Port=${server.port}`);
  }

  if (server.sshKey) {
    options.push(`-o IdentityFile=${server.sshKey}`);
  }

  return options;
}
