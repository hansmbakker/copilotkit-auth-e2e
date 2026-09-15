#!/bin/bash
set -e

# The user-secrets volume mount (see devcontainer.json) is created fresh and owned by root;
# fix ownership so the vscode user (and dotnet user-secrets) can write to it.
sudo mkdir -p "$HOME/.microsoft"
sudo chown -R "$(id -u):$(id -g)" "$HOME/.microsoft"

# Install Aspire CLI and Azure Functions Core Tools
curl -sSL https://aspire.dev/install.sh | bash
