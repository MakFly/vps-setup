# VPS Setup Makefile
# Quick commands for common operations

.PHONY: help provision run security check lint tags clean menu config

# Default target
help:
	@echo "VPS Setup - Ansible Provisioning"
	@echo ""
	@echo "Usage: make <command>"
	@echo ""
	@echo "Commands:"
	@echo "  menu       Launch interactive component selection menu"
	@echo "  config     Generate config from command line arguments"
	@echo "  provision  Run full provisioning with menu"
	@echo "  run        Run ansible-playbook with existing config"
	@echo "  security   Run security hardening only"
	@echo "  check      Dry run (no changes)"
	@echo "  lint       Check Ansible syntax"
	@echo "  tags       List available tags"
	@echo "  clean      Remove generated config files"
	@echo "  validate   Validate SSH keys before hardening"
	@echo ""
	@echo "Examples:"
	@echo "  make menu"
	@echo "  make run HOST=192.168.1.100 USER=root"
	@echo "  make check HOST=192.168.1.100"
	@echo "  make security HOST=192.168.1.100"

# Interactive menu
menu:
	@echo "Launching interactive menu..."
	@chmod +x files/menu/menu.sh
	@./files/menu/menu.sh --run

# Generate config with CLI args
config:
	@chmod +x files/menu/generate_config.sh
	@./files/menu/generate_config.sh $(ARGS)

# Full provisioning
provision: menu
	@$(MAKE) run

# Run with existing config
run:
ifndef HOST
	$(error HOST is required. Usage: make run HOST=<ip> USER=<user>)
endif
	ansible-playbook -i $(HOST), -u $(or $(USER),root) \
		--ssh-common-args='-o StrictHostKeyChecking=no' \
		-e @provision_config.yml \
		playbooks/site.yml

# Security hardening only
security:
ifndef HOST
	$(error HOST is required. Usage: make security HOST=<ip> USER=<user>)
endif
	ansible-playbook -i $(HOST), -u $(or $(USER),root) \
		--ssh-common-args='-o StrictHostKeyChecking=no' \
		playbooks/security.yml

# Dry run (check mode)
check:
ifndef HOST
	$(error HOST is required. Usage: make check HOST=<ip> USER=<user>)
endif
	ansible-playbook -i $(HOST), -u $(or $(USER),root) \
		--ssh-common-args='-o StrictHostKeyChecking=no' \
		-e @provision_config.yml \
		--check --diff \
		playbooks/site.yml

# Lint Ansible files
lint:
	@echo "Checking Ansible syntax..."
	ansible-lint playbooks/ roles/ 2>/dev/null || \
	ansible-playbook --syntax-check playbooks/*.yml
	@echo "✓ Syntax check passed"

# List available tags
tags:
	@echo "Available tags:"
	@ansible-playbook playbooks/site.yml --list-tags 2>/dev/null | grep -E "^\s+TASK TAGS:" || true

# Clean generated files
clean:
	@rm -f provision_config.yml
	@echo "✓ Cleaned generated config files"

# Validate SSH keys
validate:
ifndef HOST
	@chmod +x scripts/validate_ssh_key.sh
	@./scripts/validate_ssh_key.sh --local
else
	@chmod +x scripts/validate_ssh_key.sh
	@./scripts/validate_ssh_key.sh --remote $(HOST) $(or $(USER),root)
endif

# Quick install with all defaults
quick:
ifndef HOST
	$(error HOST is required. Usage: make quick HOST=<ip> USER=<user>)
endif
	@./files/menu/generate_config.sh --docker --nodejs --bun --security --user $(or $(USER),root)
	ansible-playbook -i $(HOST), -u $(or $(USER),root) \
		--ssh-common-args='-o StrictHostKeyChecking=no' \
		-e @provision_config.yml \
		playbooks/site.yml
