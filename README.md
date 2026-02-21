# VPS Setup CLI

CLI persistant pour le provisioning VPS avec Ansible. Gère plusieurs serveurs, profiles de configuration, et historique des déploiements.

## Installation

### Option 1: Script d'installation (recommandé)

```bash
curl -fsSL https://raw.githubusercontent.com/kev/vps-setup/main/install.sh | bash
```

### Option 2: Via Bun

```bash
# Installer bun si nécessaire
curl -fsSL https://bun.sh/install | bash

# Installer le CLI
bun install -g github:kev/vps-setup
```

### Option 3: Télécharger le binaire

Télécharge le binaire correspondant à ta plateforme depuis [Releases](https://github.com/kev/vps-setup/releases):

```bash
# Linux x64
curl -fsSL https://github.com/kev/vps-setup/releases/latest/download/vps-setup-linux-x64 -o ~/.local/bin/vps-setup
chmod +x ~/.local/bin/vps-setup

# Linux ARM64
curl -fsSL https://github.com/kev/vps-setup/releases/latest/download/vps-setup-linux-arm64 -o ~/.local/bin/vps-setup
chmod +x ~/.local/bin/vps-setup

# macOS (Apple Silicon)
curl -fsSL https://github.com/kev/vps-setup/releases/latest/download/vps-setup-darwin-arm64 -o ~/.local/bin/vps-setup
chmod +x ~/.local/bin/vps-setup

# macOS (Intel)
curl -fsSL https://github.com/kev/vps-setup/releases/latest/download/vps-setup-darwin-x64 -o ~/.local/bin/vps-setup
chmod +x ~/.local/bin/vps-setup
```

### Option 4: Depuis les sources

```bash
git clone https://github.com/kev/vps-setup.git
cd vps-setup
bun install
bun run build

# Installer globalement
cp dist/vps-setup ~/.local/bin/
```

## Prérequis

- **Ansible** doit être installé sur la machine locale
- **Accès SSH** aux serveurs cibles

```bash
# Installer Ansible (si nécessaire)
pip install ansible
# ou
brew install ansible
```

## Démarrage rapide

```bash
# Initialiser la configuration
vps-setup init

# Ajouter un serveur
vps-setup server add prod-web --host 192.168.1.100 --user root

# Lister les profiles disponibles
vps-setup profile list

# Provisionner un serveur
vps-setup setup prod-web --profile full-stack

# Ou lancer le menu interactif
vps-setup
```

## Commandes

### Serveurs

```bash
vps-setup server add <name>        # Ajouter un serveur
vps-setup server list              # Lister les serveurs
vps-setup server show <name>       # Détails d'un serveur
vps-setup server edit <name>       # Modifier un serveur
vps-setup server delete <name>     # Supprimer un serveur
vps-setup server test <name>       # Tester la connexion SSH
```

### Profiles

```bash
vps-setup profile create <name>    # Créer un profile
vps-setup profile list             # Lister les profiles
vps-setup profile show <name>      # Détails d'un profile
vps-setup profile edit <name>      # Modifier un profile
vps-setup profile delete <name>    # Supprimer un profile
vps-setup profile duplicate <src> <dst>  # Dupliquer un profile
```

### Provisioning

```bash
vps-setup setup <server>                    # Provisioning interactif
vps-setup setup <server> --profile <name>   # Avec un profile spécifique
vps-setup setup <server> --dry-run          # Mode check (pas de changements)
vps-setup setup <server> --tags docker      # Exécuter seulement certains tags
vps-setup setup --all --profile <name>      # Appliquer à tous les serveurs
```

### Historique

```bash
vps-setup history <server>        # Voir l'historique
vps-setup history <server> --last 5    # Les 5 derniers runs
```

### Configuration

```bash
vps-setup config show             # Voir la configuration
vps-setup config set <key> <value>  # Modifier une valeur
```

## Structure de configuration

Les données sont stockées dans `~/.config/vps-setup/`:

```
~/.config/vps-setup/
├── config.yml              # Configuration globale
├── servers/
│   ├── prod-web.yml        # Configuration serveur
│   └── staging.yml
├── profiles/
│   ├── full-stack.yml      # Profile complet
│   ├── minimal.yml         # Profile minimal
│   └── security-only.yml   # Sécurité seule
└── history/
    └── prod-web.log        # Historique par serveur
```

## Profiles par défaut

| Profile | Composants |
|---------|------------|
| `full-stack` | Docker, PHP-FPM, Caddy, Node.js, Bun, Security |
| `minimal` | Docker, Security |
| `security-only` | Security |

## Menu interactif

Lance `vps-setup` sans arguments pour accéder au menu TUI:

```
╔═══════════════════════════════════════════════════════════════╗
║                    VPS Setup Manager                          ║
╚═══════════════════════════════════════════════════════════════╝

  Servers: 2 | Profiles: 3

  > 🚀 Setup server with profile
    🖥️  Manage servers
    📋 Manage profiles
    📜 View history
    ⚙️  Settings
    👋 Exit
```

## Intégration avec Ansible

Le CLI génère dynamiquement un fichier de configuration pour Ansible et exécute `ansible-playbook` avec les bons paramètres.

Structure attendue des playbooks Ansible (configurable):

```
ansible-vps-setup/
├── playbooks/
│   └── provision.yml    # Playbook principal
├── roles/
│   ├── docker/
│   ├── php_fpm/
│   ├── caddy/
│   ├── nodejs/
│   ├── security/
│   └── ...
└── inventory/
```

## Développement

```bash
# Cloner le repo
git clone https://github.com/kev/vps-setup.git
cd vps-setup

# Installer les dépendances
bun install

# Mode développement
bun run dev --help

# Build
bun run build

# Build pour toutes les plateformes
bun run build:all

# Tests
bun test
```

## Licence

MIT
