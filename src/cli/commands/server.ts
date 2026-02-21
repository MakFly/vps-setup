import { Command } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { PersistenceManager, testSSHConnection } from "@/core/index.ts";
import type { Server, ServerInput } from "@/types/index.ts";
import { DEFAULT_SERVER } from "@/types/index.ts";
import { success, error, info, warn, header } from "@/utils/index.ts";

/**
 * Create server commands
 */
export function createServerCommands(pm: PersistenceManager): Command {
  const server = new Command("server")
    .description("Manage server configurations");

  // server add
  server
    .command("add <name>")
    .description("Add a new server")
    .option("-H, --host <host>", "Server host (IP or hostname)")
    .option("-u, --user <user>", "SSH user")
    .option("-p, --port <port>", "SSH port", parseInt)
    .option("-k, --ssh-key <path>", "Path to SSH private key")
    .option("-t, --tags <tags>", "Comma-separated tags")
    .option("--os <os>", "Operating system (debian, ubuntu, auto)")
    .option("--notes <notes>", "Server notes")
    .option("--no-test", "Skip SSH connection test")
    .action(async (name, options) => {
      header(`Add Server: ${name}`);

      // Check if server already exists
      if (pm.serverExists(name)) {
        error(`Server "${name}" already exists`);
        process.exit(1);
      }

      let serverData: ServerInput;

      if (options.host && options.user) {
        // Non-interactive mode
        serverData = {
          name,
          host: options.host,
          user: options.user,
          port: options.port || DEFAULT_SERVER.port,
          os: options.os || DEFAULT_SERVER.os,
          sshKey: options.sshKey,
          tags: options.tags ? options.tags.split(",").map((t: string) => t.trim()) : [],
          notes: options.notes,
        };
      } else {
        // Interactive mode
        const result = await p.group(
          {
            host: () =>
              p.text({
                message: "Host (IP or hostname)",
                placeholder: "192.168.1.100",
                validate: (value) => {
                  if (!value) return "Host is required";
                  return undefined;
                },
              }),
            user: () =>
              p.text({
                message: "SSH user",
                placeholder: "root",
                initialValue: "root",
                validate: (value) => {
                  if (!value) return "User is required";
                  return undefined;
                },
              }),
            port: () =>
              p.text({
                message: "SSH port",
                placeholder: "22",
                initialValue: "22",
              }),
            sshKey: () =>
              p.text({
                message: "SSH key path (optional, press Enter to skip)",
                placeholder: "~/.ssh/id_rsa",
              }),
            os: () =>
              p.select({
                message: "Operating system",
                options: [
                  { value: "auto", label: "Auto-detect" },
                  { value: "debian", label: "Debian" },
                  { value: "ubuntu", label: "Ubuntu" },
                ],
                initialValue: "auto",
              }),
            tags: () =>
              p.text({
                message: "Tags (comma-separated, optional)",
                placeholder: "production, web",
              }),
            notes: () =>
              p.text({
                message: "Notes (optional)",
                placeholder: "Production web server",
              }),
          },
          {
            onCancel: () => {
              p.cancel("Operation cancelled");
              process.exit(0);
            },
          }
        );

        serverData = {
          name,
          host: result.host,
          user: result.user,
          port: parseInt(result.port) || 22,
          sshKey: result.sshKey || undefined,
          os: result.os as "debian" | "ubuntu" | "auto",
          tags: result.tags ? result.tags.split(",").map((t) => t.trim()) : [],
          notes: result.notes || undefined,
        };
      }

      // Save server
      const server: Server = {
        ...serverData,
        createdAt: new Date().toISOString(),
      };

      try {
        pm.saveServer(server);
        success(`Server "${name}" saved`);
      } catch (err) {
        error(`Failed to save server: ${err}`);
        process.exit(1);
      }

      // Test connection
      if (options.test !== false) {
        const shouldTest = await p.confirm({
          message: "Test SSH connection now?",
          initialValue: true,
        });

        if (shouldTest) {
          const spinner = p.spinner();
          spinner.start("Testing SSH connection...");

          const testResult = await testSSHConnection(server);

          if (testResult.success) {
            spinner.stop(`SSH connection successful (${testResult.os} ${testResult.version})`);
            info(`Latency: ${testResult.duration}ms`);
          } else {
            spinner.stop("SSH connection failed");
            error(testResult.error || "Unknown error");
            warn("Server saved but connection failed. Check your SSH configuration.");
          }
        }
      }

      p.outro(chalk.green("Done!"));
    });

  // server list
  server
    .command("list")
    .alias("ls")
    .description("List all servers")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      const servers = pm.getAllServers();

      if (servers.length === 0) {
        info("No servers configured");
        info("Run 'vps-setup server add <name>' to add a server");
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(servers, null, 2));
        return;
      }

      header("Servers");

      for (const s of servers) {
        const statusIcon = s.lastProvisioned ? chalk.green("●") : chalk.gray("○");
        const tags = s.tags?.length ? chalk.gray(` [${s.tags.join(", ")}]`) : "";
        const lastRun = s.lastProvisioned
          ? chalk.gray(` (last: ${new Date(s.lastProvisioned).toLocaleDateString()})`)
          : "";

        console.log(`  ${statusIcon} ${chalk.bold(s.name)} - ${s.user}@${s.host}:${s.port || 22}${tags}${lastRun}`);

        if (s.notes) {
          console.log(`    ${chalk.gray(s.notes)}`);
        }
      }

      console.log();
    });

  // server show
  server
    .command("show <name>")
    .description("Show server details")
    .option("-j, --json", "Output as JSON")
    .action((name, options) => {
      const server = pm.getServer(name);

      if (!server) {
        error(`Server "${name}" not found`);
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(server, null, 2));
        return;
      }

      header(`Server: ${name}`);

      console.log(`  ${chalk.bold("Host:")}\t\t${server.host}`);
      console.log(`  ${chalk.bold("User:")}\t\t${server.user}`);
      console.log(`  ${chalk.bold("Port:")}\t\t${server.port || 22}`);
      console.log(`  ${chalk.bold("OS:")}\t\t${server.os || "auto"}`);

      if (server.sshKey) {
        console.log(`  ${chalk.bold("SSH Key:")}\t${server.sshKey}`);
      }

      if (server.tags?.length) {
        console.log(`  ${chalk.bold("Tags:")}\t\t${server.tags.join(", ")}`);
      }

      if (server.notes) {
        console.log(`  ${chalk.bold("Notes:")}\t\t${server.notes}`);
      }

      console.log(`  ${chalk.bold("Created:")}\t${new Date(server.createdAt).toLocaleString()}`);

      if (server.lastProvisioned) {
        console.log(`  ${chalk.bold("Last Run:")}\t${new Date(server.lastProvisioned).toLocaleString()}`);
      }

      console.log();
    });

  // server edit
  server
    .command("edit <name>")
    .description("Edit server configuration")
    .action(async (name) => {
      const server = pm.getServer(name);

      if (!server) {
        error(`Server "${name}" not found`);
        process.exit(1);
      }

      header(`Edit Server: ${name}`);

      const result = await p.group(
        {
          host: () =>
            p.text({
              message: "Host",
              initialValue: server.host,
              validate: (value) => {
                if (!value) return "Host is required";
                return undefined;
              },
            }),
          user: () =>
            p.text({
              message: "SSH user",
              initialValue: server.user,
              validate: (value) => {
                if (!value) return "User is required";
                return undefined;
              },
            }),
          port: () =>
            p.text({
              message: "SSH port",
              initialValue: String(server.port || 22),
            }),
          sshKey: () =>
            p.text({
              message: "SSH key path",
              initialValue: server.sshKey || "",
            }),
          os: () =>
            p.select({
              message: "Operating system",
              options: [
                { value: "auto", label: "Auto-detect" },
                { value: "debian", label: "Debian" },
                { value: "ubuntu", label: "Ubuntu" },
              ],
              initialValue: server.os || "auto",
            }),
          tags: () =>
            p.text({
              message: "Tags (comma-separated)",
              initialValue: server.tags?.join(", ") || "",
            }),
          notes: () =>
            p.text({
              message: "Notes",
              initialValue: server.notes || "",
            }),
        },
        {
          onCancel: () => {
            p.cancel("Operation cancelled");
            process.exit(0);
          },
        }
      );

      const updated: Server = {
        ...server,
        host: result.host,
        user: result.user,
        port: parseInt(result.port) || 22,
        sshKey: result.sshKey || undefined,
        os: result.os as "debian" | "ubuntu" | "auto",
        tags: result.tags ? result.tags.split(",").map((t) => t.trim()) : [],
        notes: result.notes || undefined,
      };

      try {
        pm.saveServer(updated);
        success(`Server "${name}" updated`);
      } catch (err) {
        error(`Failed to update server: ${err}`);
        process.exit(1);
      }

      p.outro(chalk.green("Done!"));
    });

  // server delete
  server
    .command("delete <name>")
    .alias("rm")
    .description("Delete a server")
    .option("-f, --force", "Skip confirmation")
    .action(async (name, options) => {
      const server = pm.getServer(name);

      if (!server) {
        error(`Server "${name}" not found`);
        process.exit(1);
      }

      if (!options.force) {
        const shouldDelete = await p.confirm({
          message: `Delete server "${name}"?`,
          initialValue: false,
        });

        if (!shouldDelete) {
          info("Cancelled");
          return;
        }
      }

      const deleted = pm.deleteServer(name);

      if (deleted) {
        success(`Server "${name}" deleted`);
      } else {
        error(`Failed to delete server "${name}"`);
        process.exit(1);
      }
    });

  // server test
  server
    .command("test <name>")
    .description("Test SSH connection to a server")
    .action(async (name) => {
      const server = pm.getServer(name);

      if (!server) {
        error(`Server "${name}" not found`);
        process.exit(1);
      }

      header(`Testing Connection: ${name}`);

      const spinner = p.spinner();
      spinner.start("Connecting...");

      const result = await testSSHConnection(server);

      if (result.success) {
        spinner.stop("Connection successful");
        console.log();
        console.log(`  ${chalk.bold("OS:")}\t\t${result.os}`);
        console.log(`  ${chalk.bold("Version:")}\t${result.version}`);
        console.log(`  ${chalk.bold("Latency:")}\t${result.duration}ms`);
      } else {
        spinner.stop("Connection failed");
        error(result.error || "Unknown error");
        process.exit(1);
      }

      console.log();
    });

  return server;
}
