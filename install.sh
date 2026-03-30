#!/bin/bash

# ==========================================================================
# Script de Instalação IAZAP (AtendeChat) - CORRIGIDO
# Desenvolvedor: Dário (darioitaquera@gmail.com)
# ==========================================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${YELLOW}Uso: bash install.sh SEU_TOKEN_GITHUB${NC}"
    exit 1
fi

TOKEN=$1
REPO_URL="https://darioitaquera:${TOKEN}@github.com/PU2PNY/iazap.git"
INSTALL_DIR="/home/deploy/iazap"

echo -e "${BLUE}>>> Ajustando versões de Node/NPM e Banco de Dados...${NC}"

# 1. Instalação correta do NPM para Node 18
npm install -g npm@10.8.2 pm2

# 2. Configuração do PostgreSQL (ajuste de diretório para evitar erro de permissão)
cd /tmp
sudo -u postgres psql -c "CREATE USER iazap_user WITH PASSWORD 'iazap_password';" || true
sudo -u postgres psql -c "CREATE DATABASE iazap_db OWNER iazap_user;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iazap_db TO iazap_user;" || true

# 3. Clonagem e Instalação
echo -e "${YELLOW}>>> Preparando diretório e clonando...${NC}"
sudo rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR
git clone $REPO_URL $INSTALL_DIR

# 4. Backend
echo -e "${YELLOW}>>> Instalando Backend...${NC}"
cd $INSTALL_DIR/backend
npm install

# 5. Frontend
echo -e "${YELLOW}>>> Instalando Frontend...${NC}"
cd $INSTALL_DIR/frontend
npm install

echo -e "${GREEN}>>> Instalação concluída!${NC}"
