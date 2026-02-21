#!/usr/bin/env bash
#
# VPS Setup - Quick Start Script
# Usage: ./setup.sh <host> [user]
#
# Example:
#   ./setup.sh 192.168.1.100 root
#   ./setup.sh myserver.com ubuntu
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
    echo "Usage: $0 <host> [user] [options]"
    echo ""
    echo "Arguments:"
    echo "  host        Target host IP or hostname"
    echo "  user        SSH user (default: root)"
    echo ""
    echo "Options:"
    echo "  --check     Dry run (no changes)"
    echo "  --tags      Comma-separated list of tags to run"
    echo "  --skip-tags Comma-separated list of tags to skip"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.1.100"
    echo "  $0 myserver.com ubuntu"
    echo "  $0 192.168.1.100 root --check"
    echo "  $0 192.168.1.100 root --tags docker,security"
}

# Check dependencies
check_dependencies() {
    local missing=()

    if ! command -v ansible-playbook &> /dev/null; then
        missing+=("ansible")
    fi

    if ! command -v ssh &> /dev/null; then
        missing+=("openssh-client")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Missing dependencies: ${missing[*]}${NC}"
        echo "Install with: pip install ansible"
        exit 1
    fi
}

# Parse arguments
if [[ $# -lt 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    usage
    exit 0
fi

HOST="$1"
shift
USER="${1:-root}"
if [[ "$USER" != --* ]]; then
    shift
fi

CHECK=false
TAGS=""
SKIP_TAGS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --check)
            CHECK=true
            shift
            ;;
        --tags)
            TAGS="$2"
            shift 2
            ;;
        --skip-tags)
            SKIP_TAGS="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

check_dependencies

# Build ansible command
ANSIBLE_CMD="ansible-playbook"
ANSIBLE_CMD+=" -i ${HOST},"
ANSIBLE_CMD+=" -u ${USER}"
ANSIBLE_CMD+=" --ssh-common-args='-o StrictHostKeyChecking=no'"

if [[ -f "$PROJECT_ROOT/provision_config.yml" ]]; then
    ANSIBLE_CMD+=" -e @$PROJECT_ROOT/provision_config.yml"
fi

if $CHECK; then
    ANSIBLE_CMD+=" --check --diff"
fi

if [[ -n "$TAGS" ]]; then
    ANSIBLE_CMD+=" --tags $TAGS"
fi

if [[ -n "$SKIP_TAGS" ]]; then
    ANSIBLE_CMD+=" --skip-tags $SKIP_TAGS"
fi

ANSIBLE_CMD+=" $PROJECT_ROOT/playbooks/site.yml"

echo -e "${CYAN}Running VPS Setup...${NC}"
echo -e "${YELLOW}Host: ${HOST}${NC}"
echo -e "${YELLOW}User: ${USER}${NC}"
echo ""

if $CHECK; then
    echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
fi

echo -e "${YELLOW}Command: ${ANSIBLE_CMD}${NC}"
echo ""

eval "$ANSIBLE_CMD"
