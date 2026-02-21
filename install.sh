#!/bin/bash
#
# VPS Setup CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/kev/vps-setup/main/install.sh | bash
# Or:    bun install github:kev/vps-setup
#

set -e

REPO="kev/vps-setup"
BINARY_NAME="vps-setup"
INSTALL_DIR="$HOME/.local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    VPS Setup Installer                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case $OS in
        darwin) OS="darwin" ;;
        linux)  OS="linux" ;;
        *)
            echo -e "${RED}Unsupported OS: $OS${NC}"
            exit 1
            ;;
    esac

    case $ARCH in
        x86_64|amd64) ARCH="x64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *)
            echo -e "${RED}Unsupported architecture: $ARCH${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}Detected platform: $OS-$ARCH${NC}"
}

# Check if bun is installed
check_bun() {
    if command -v bun &> /dev/null; then
        echo -e "${GREEN}✓ Bun is installed${NC}"
        return 0
    else
        echo -e "${YELLOW}Bun is not installed${NC}"
        return 1
    fi
}

# Install via bun (preferred method)
install_via_bun() {
    echo -e "${BLUE}Installing via bun...${NC}"

    if ! check_bun; then
        echo -e "${YELLOW}Installing bun first...${NC}"
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
    fi

    # Install globally
    bun install -g github:$REPO

    echo -e "${GREEN}✓ Installed via bun${NC}"
}

# Download pre-built binary
download_binary() {
    echo -e "${BLUE}Downloading pre-built binary...${NC}"

    BINARY_NAME="vps-setup-${OS}-${ARCH}"
    if [ "$OS" = "windows" ]; then
        BINARY_NAME="${BINARY_NAME}.exe"
    fi

    DOWNLOAD_URL="https://github.com/$REPO/releases/latest/download/${BINARY_NAME}"

    # Create install directory
    mkdir -p "$INSTALL_DIR"

    # Download binary
    echo -e "${BLUE}Downloading from: $DOWNLOAD_URL${NC}"

    if command -v curl &> /dev/null; then
        curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/vps-setup"
    elif command -v wget &> /dev/null; then
        wget -q "$DOWNLOAD_URL" -O "$INSTALL_DIR/vps-setup"
    else
        echo -e "${RED}Neither curl nor wget is available${NC}"
        exit 1
    fi

    # Make executable
    chmod +x "$INSTALL_DIR/vps-setup"

    echo -e "${GREEN}✓ Binary installed to: $INSTALL_DIR/vps-setup${NC}"

    # Check if in PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo -e "${YELLOW}⚠ $INSTALL_DIR is not in your PATH${NC}"
        echo -e "${YELLOW}Add this to your shell config (~/.zshrc or ~/.bashrc):${NC}"
        echo -e "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
}

# Build from source
build_from_source() {
    echo -e "${BLUE}Building from source...${NC}"

    if ! check_bun; then
        echo -e "${YELLOW}Installing bun first...${NC}"
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
    fi

    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    # Clone repo
    echo -e "${BLUE}Cloning repository...${NC}"
    git clone "https://github.com/$REPO.git" .
    cd vps-setup 2>/dev/null || true

    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    bun install

    # Build binary
    echo -e "${BLUE}Building binary...${NC}"
    bun run build

    # Install
    mkdir -p "$INSTALL_DIR"
    cp dist/vps-setup "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/vps-setup"

    # Cleanup
    cd -
    rm -rf "$TEMP_DIR"

    echo -e "${GREEN}✓ Built and installed to: $INSTALL_DIR/vps-setup${NC}"
}

# Main installation flow
main() {
    detect_platform

    echo
    echo -e "${BLUE}Choose installation method:${NC}"
    echo "  1) Install via bun (recommended, auto-updates)"
    echo "  2) Download pre-built binary"
    echo "  3) Build from source"
    echo

    read -p "Enter choice [1-3] (default: 1): " choice
    choice=${choice:-1}

    case $choice in
        1)
            install_via_bun
            ;;
        2)
            download_binary
            ;;
        3)
            build_from_source
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac

    echo
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Installation Complete!                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "Run ${BLUE}vps-setup init${NC} to get started"
    echo
}

main "$@"
