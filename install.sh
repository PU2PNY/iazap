#!/bin/bash

# ==========================================================================
# Script de Instalação IAZAP (AtendeChat)
# Desenvolvido por: Dário (darioitaquera@gmail.com)
# Versão: 1.0.0 | Kernel: 5.15.0-173-generic
# ==========================================================================

set -e

# Cores para o terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Iniciando a instalação do IAZAP...${NC}"

# 1. Atualização do Sistema
echo -e "${YELLOW}Atualizando repositórios...${NC}"
apt update && apt upgrade -y

# 2. Instalação de Dependências Essenciais
echo -e "${YELLOW}Instalando dependências base...${NC}"
apt install -y git curl wget sudo zip unzip nginx libpng-dev libjpeg-dev libfreetype6-dev

# 3. Instalação do Node.js 18 (LTS)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 4. Instalação do PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    npm install -g pm2
fi

# 5. Configuração do Diretório de Instalação
INSTALL_DIR="/home/deploy/iazap"
TOKEN=$1
REPO_URL="https://darioitaquera:${TOKEN}@github.com/PU2PNY/iazap.git"

echo -e "${YELLOW}Clonando repositório em $INSTALL_DIR...${NC}"
sudo rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR
git clone $REPO_URL $INSTALL_DIR

# 6. Permissões
chown -R root:root $INSTALL_DIR
chmod -R 755 $INSTALL_DIR

cd $INSTALL_DIR

echo -e "${GREEN}Instalação base concluída com sucesso!${NC}"
echo -e "Acesse o diretório: cd $INSTALL_DIR para configurar as variáveis de ambiente."
