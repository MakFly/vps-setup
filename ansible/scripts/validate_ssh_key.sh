#!/usr/bin/env bash
#
# VPS Setup - SSH Key Validation
# Ensures SSH keys are properly configured before hardening
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_ssh_keys() {
    local user="${1:-$USER}"
    local auth_keys_file="~${user}/.ssh/authorized_keys"

    echo -e "${YELLOW}Checking SSH keys for user: ${user}${NC}"

    # Check if .ssh directory exists
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "${user}@localhost" "test -d ~/.ssh" 2>/dev/null; then
        echo -e "${RED}✗ .ssh directory not found${NC}"
        return 1
    fi

    # Check if authorized_keys exists
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "${user}@localhost" "test -f ~/.ssh/authorized_keys" 2>/dev/null; then
        echo -e "${RED}✗ authorized_keys file not found${NC}"
        return 1
    fi

    # Check if authorized_keys has content
    local key_count
    key_count=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "${user}@localhost" "wc -l < ~/.ssh/authorized_keys" 2>/dev/null || echo "0")

    if [[ "$key_count" -eq 0 ]]; then
        echo -e "${RED}✗ No SSH keys found in authorized_keys${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ ${key_count} SSH key(s) found${NC}"
    return 0
}

test_ssh_connection() {
    local host="$1"
    local user="${2:-root}"

    echo -e "${YELLOW}Testing SSH connection to ${user}@${host}${NC}"

    if ssh -o BatchMode=yes -o PasswordAuthentication=no -o ConnectTimeout=10 "${user}@${host}" "echo 'Connection successful'" 2>/dev/null; then
        echo -e "${GREEN}✓ SSH connection with key authentication works${NC}"
        return 0
    else
        echo -e "${RED}✗ SSH connection failed or requires password${NC}"
        echo -e "${YELLOW}Make sure you have SSH keys configured before running security hardening${NC}"
        return 1
    fi
}

# Main
case "${1:-}" in
    --remote)
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 --remote <host> [user]"
            exit 1
        fi
        test_ssh_connection "$2" "${3:-root}"
        ;;
    --local)
        check_ssh_keys "${2:-$USER}"
        ;;
    *)
        echo "VPS Setup - SSH Key Validation"
        echo ""
        echo "Usage:"
        echo "  $0 --local [user]        Check local SSH keys"
        echo "  $0 --remote <host> [user] Test SSH connection to remote host"
        echo ""
        echo "Examples:"
        echo "  $0 --local"
        echo "  $0 --local ubuntu"
        echo "  $0 --remote 192.168.1.100 root"
        ;;
esac
