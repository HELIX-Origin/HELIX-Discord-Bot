#!/usr/bin/env bash
# ==============================================================================
# HELIX Discord Bot - Lavalink v4 systemd Service Installer & Setup Script
# ==============================================================================
set -euo pipefail

# Ensure script is run with root/sudo privileges
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "❌ This script must be run as root or with sudo:"
  echo "   sudo chmod +x ./scripts/install-lavalink-service.sh"
  echo "   sudo ./scripts/install-lavalink-service.sh"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAVALINK_DIR="${PROJECT_DIR}/lavalink"
SERVICE_NAME="helix-lavalink"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Detect real calling user when run with sudo
TARGET_USER="${SUDO_USER:-$(id -un)}"
TARGET_GROUP="$(id -gn "${TARGET_USER}" 2>/dev/null || echo "${TARGET_USER}")"
NODE_BIN="$(which node 2>/dev/null || echo "/usr/bin/node")"
JAVA_BIN="$(which java 2>/dev/null || echo "")"

echo "=========================================================="
echo "🚀 Installing ${SERVICE_NAME} 24/7 systemd service..."
echo "📁 Project Directory:  ${PROJECT_DIR}"
echo "📁 Lavalink Directory: ${LAVALINK_DIR}"
echo "👤 Service User:       ${TARGET_USER}:${TARGET_GROUP}"
echo "=========================================================="

# Check for Java 17+
if [ -z "${JAVA_BIN}" ]; then
  echo "⚠️  Java runtime not found in PATH."
  if command -v apt-get >/dev/null 2>&1; then
    echo "📦 Installing OpenJDK 21 JRE via apt..."
    apt-get update -y && apt-get install -y openjdk-21-jre-headless
    JAVA_BIN="$(which java)"
  else
    echo "❌ Please install Java 17 or higher (Java 21 recommended) before proceeding."
    exit 1
  fi
fi

echo "☕ Java Binary:        ${JAVA_BIN}"

# Ensure lavalink directory exists with proper permissions
mkdir -p "${LAVALINK_DIR}"
mkdir -p "${LAVALINK_DIR}/logs"
mkdir -p "${LAVALINK_DIR}/plugins"

# Auto-download Lavalink.jar if missing
if [ ! -f "${LAVALINK_DIR}/Lavalink.jar" ]; then
  echo "📥 Downloading latest Lavalink v4 server jar..."
  if [ -n "${SUDO_USER:-}" ]; then
    sudo -u "${SUDO_USER}" bash -c "cd '${PROJECT_DIR}' && ${NODE_BIN} scripts/lavalink.js download"
  else
    (cd "${PROJECT_DIR}" && "${NODE_BIN}" scripts/lavalink.js download)
  fi
fi

# Ensure application.yml exists from example template
if [ ! -f "${LAVALINK_DIR}/application.yml" ]; then
  if [ -f "${PROJECT_DIR}/application.yml" ]; then
    echo "📋 Copying application.yml from project root into lavalink/application.yml..."
    cp "${PROJECT_DIR}/application.yml" "${LAVALINK_DIR}/application.yml"
  elif [ -f "${LAVALINK_DIR}/application.yml.example" ]; then
    echo "📋 Initializing application.yml from lavalink/application.yml.example..."
    cp "${LAVALINK_DIR}/application.yml.example" "${LAVALINK_DIR}/application.yml"
  elif [ -f "${PROJECT_DIR}/application.yml.example" ]; then
    echo "📋 Initializing application.yml from project root application.yml.example..."
    cp "${PROJECT_DIR}/application.yml.example" "${LAVALINK_DIR}/application.yml"
  fi
fi

chown -R "${TARGET_USER}:${TARGET_GROUP}" "${LAVALINK_DIR}"

# Generate customized systemd service unit
cat <<EOF > "${SERVICE_FILE}"
[Unit]
Description=HELIX Lavalink v4 Audio Server
Documentation=https://github.com/HELIX-Origin/HELIX-Discord-Bot/wiki/Music
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${TARGET_USER}
Group=${TARGET_GROUP}
WorkingDirectory=${LAVALINK_DIR}
ExecStart=${JAVA_BIN} -jar ${LAVALINK_DIR}/Lavalink.jar
Restart=always
RestartSec=5
TimeoutStopSec=15

# Environment variables from project root .env
EnvironmentFile=-${PROJECT_DIR}/.env

# Sandboxing & security
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=${LAVALINK_DIR}

StandardOutput=journal
StandardError=journal
SyslogIdentifier=helix-lavalink

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "${SERVICE_FILE}"

echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

echo "⚡ Enabling and starting ${SERVICE_NAME}.service..."
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

echo "=========================================================="
echo "✅ ${SERVICE_NAME} service successfully installed and active!"
echo "📜 Check status:  sudo systemctl status ${SERVICE_NAME}"
echo "📜 View logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo "=========================================================="
