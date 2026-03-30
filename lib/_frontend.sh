#!/bin/bash
# 
# functions for setting up app frontend

#######################################
# configura swap para build do frontend
# Arguments:
#   None
#######################################
frontend_setup_memory() {
  print_banner
  printf "${WHITE} 💻 Configurando memória para build do frontend...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 1

  # Verificar memória disponível
  TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
  FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
  SWAP_MEM=$(free -m | awk '/^Swap:/{print $2}')
  
  echo ""
  echo -e "${INFO_COLOR}📊 Memória do sistema:${RESET_COLOR}"
  echo "   RAM Total: ${TOTAL_MEM}MB"
  echo "   RAM Livre: ${FREE_MEM}MB"
  echo "   SWAP Total: ${SWAP_MEM}MB"
  echo ""
  
  log_message "INFO" "RAM: ${TOTAL_MEM}MB total, ${FREE_MEM}MB livre, SWAP: ${SWAP_MEM}MB"
  
  # SEMPRE criar swap se não tiver SWAP configurado (React build precisa de margem)
  # Ou se RAM + SWAP < 6GB (aumentado o threshold)
  TOTAL_AVAILABLE=$((TOTAL_MEM + SWAP_MEM))
  
  if [ $SWAP_MEM -lt 1024 ] || [ $TOTAL_AVAILABLE -lt 6144 ]; then
    echo -e "${WARNING_COLOR}⚠️  SWAP insuficiente para build React seguro (SWAP: ${SWAP_MEM}MB)${RESET_COLOR}"
    echo -e "${INFO_COLOR}📦 Criando arquivo de swap temporário (4GB)...${RESET_COLOR}"
    echo ""
    
    log_message "WARNING" "SWAP insuficiente, criando swap temporário"
    
    # Remover swap anterior se existir
    sudo swapoff /swapfile_atendechat 2>/dev/null
    sudo rm -f /swapfile_atendechat 2>/dev/null
    
    # Criar swap file de 4GB
    sudo fallocate -l 4G /swapfile_atendechat 2>/dev/null || sudo dd if=/dev/zero of=/swapfile_atendechat bs=1M count=4096 status=progress 2>/dev/null
    sudo chmod 600 /swapfile_atendechat
    sudo mkswap /swapfile_atendechat >/dev/null 2>&1
    sudo swapon /swapfile_atendechat
    
    # Verificar se swap foi ativado
    NEW_SWAP=$(free -m | awk '/^Swap:/{print $2}')
    
    if [ $NEW_SWAP -gt $SWAP_MEM ]; then
      echo -e "${SUCCESS_COLOR}✅ Swap temporário criado (4GB) - Total SWAP agora: ${NEW_SWAP}MB${RESET_COLOR}"
      echo ""
      log_message "SUCCESS" "Swap temporário de 4GB ativado. Total SWAP: ${NEW_SWAP}MB"
    else
      echo -e "${WARNING_COLOR}⚠️  Não foi possível criar swap, continuando mesmo assim...${RESET_COLOR}"
      echo ""
      log_message "WARNING" "Falha ao criar swap temporário"
    fi
    
    # Marcar que criamos swap para limpar depois
    echo "1" > /tmp/atendechat_swap_created
  else
    echo -e "${SUCCESS_COLOR}✅ Memória suficiente (RAM: ${TOTAL_MEM}MB + SWAP: ${SWAP_MEM}MB = ${TOTAL_AVAILABLE}MB)${RESET_COLOR}"
    echo ""
    log_message "INFO" "Memória suficiente, não precisa criar swap adicional"
  fi

  sleep 1
}

#######################################
# remove swap temporário
# Arguments:
#   None
#######################################
frontend_cleanup_memory() {
  # Verificar se criamos swap temporário
  if [ -f /tmp/atendechat_swap_created ]; then
    echo ""
    echo -e "${INFO_COLOR}🧹 Removendo swap temporário...${RESET_COLOR}"
    
    sudo swapoff /swapfile_atendechat 2>/dev/null
    sudo rm -f /swapfile_atendechat
    rm -f /tmp/atendechat_swap_created
    
    echo -e "${SUCCESS_COLOR}✅ Swap temporário removido${RESET_COLOR}"
    echo ""
    
    log_message "INFO" "Swap temporário removido"
  fi
}

#######################################
# installed node packages
# Arguments:
#   None
#######################################
frontend_node_dependencies() {
  print_banner
  printf "${WHITE} 💻 Instalando dependências do frontend...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando instalação das dependências do frontend"
  
  # Verificar se package.json existe
  check_file_exists "/home/deploy/${instancia_add}/frontend/package.json" "package.json do frontend"
  
  # Instalar dependências
  run_with_check "Instalação de dependências do frontend (npm install)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/frontend && npm install --force'"
  
  # Verificar se node_modules foi criado
  check_dir_exists "/home/deploy/${instancia_add}/frontend/node_modules" "node_modules do frontend"
  
  # Configurar memória para build
  frontend_setup_memory
  
  # Compilar código com configurações otimizadas
  echo ""
  echo -e "${INFO_COLOR}⚙️  Iniciando build do React (pode demorar 5-10 minutos)...${RESET_COLOR}"
  echo ""
  
  run_with_check "Compilação do código frontend (npm run build)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/frontend && GENERATE_SOURCEMAP=false NODE_OPTIONS=\"--max-old-space-size=3584\" npm run build'"
  
  # Limpar swap temporário se foi criado
  frontend_cleanup_memory
  
  # Verificar se build foi criado
  check_dir_exists "/home/deploy/${instancia_add}/frontend/build" "Pasta build compilada"
  
  log_message "SUCCESS" "Dependências do frontend instaladas com sucesso"

  sleep 2
}

#######################################
# compiles frontend code
# Arguments:
#   None
#######################################
frontend_node_build() {
  print_banner
  printf "${WHITE} 💻 Frontend compilado com sucesso!${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2
  
  # Build já foi executado em frontend_node_dependencies
}

#######################################
# updates frontend code
# Arguments:
#   None
#######################################
frontend_update() {
  print_banner
  printf "${WHITE} 💻 Atualizando o frontend...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  sudo su - deploy <<EOF
  cd /home/deploy/${empresa_atualizar}
  pm2 stop ${empresa_atualizar}-frontend
  git pull
  cd /home/deploy/${empresa_atualizar}/frontend
  npm install --force
  rm -rf build
  npm run build
  pm2 start ${empresa_atualizar}-frontend
  pm2 save
EOF

  sleep 2
}


#######################################
# sets frontend environment variables
# Arguments:
#   None
#######################################
frontend_set_env() {
  print_banner
  printf "${WHITE} 💻 Configurando variáveis de ambiente (frontend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  # ensure idempotency
  backend_url=$(echo "${backend_url/https:\/\/}")
  backend_url=${backend_url%%/*}
  backend_url=https://$backend_url

sudo su - deploy << EOF
  cat <<[-]EOF > /home/deploy/${instancia_add}/frontend/.env
REACT_APP_BACKEND_URL=${backend_url}
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
[-]EOF
EOF

  sleep 2

sudo su - deploy << EOF
  cat <<[-]EOF > /home/deploy/${instancia_add}/frontend/server.js
//simple express server to run frontend production build;
const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname, "build")));
app.get("/*", function (req, res) {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.listen(${frontend_port});

[-]EOF
EOF

  sleep 2
}

#######################################
# starts pm2 for frontend
# Arguments:
#   None
#######################################
frontend_start_pm2() {
  print_banner
  printf "${WHITE} 💻 Iniciando pm2 (frontend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando frontend com PM2"
  
  # Verificar se server.js existe
  check_file_exists "/home/deploy/${instancia_add}/frontend/server.js" "server.js do frontend"
  
  run_with_check "Iniciar frontend no PM2" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/frontend && pm2 start server.js --name ${instancia_add}-frontend'"
  
  run_with_check "Salvar configuração PM2" \
    "sudo su - deploy -c 'pm2 save'"
  
  # Verificar se PM2 está realmente online
  check_pm2_online "${instancia_add}-frontend"
  
  log_message "SUCCESS" "Frontend iniciado com sucesso no PM2"

 sleep 2
  
  sudo su - root <<EOF
   pm2 startup
  sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
EOF
  sleep 2
}

#######################################
# sets up nginx for frontend
# Arguments:
#   None
#######################################
frontend_nginx_setup() {
  print_banner
  printf "${WHITE} 💻 Configurando nginx (frontend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  frontend_hostname=$(echo "${frontend_url/https:\/\/}")
  
  echo -e "${INFO_COLOR}📝 Criando configuração Nginx para: ${frontend_hostname}${RESET_COLOR}"

  # Criar arquivo de configuração em /tmp primeiro (variáveis expandem corretamente)
  cat > /tmp/nginx_frontend_${instancia_add}.conf << NGINXEOF
server {
  server_name ${frontend_hostname};

  location / {
    proxy_pass http://127.0.0.1:${frontend_port};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_cache_bypass \$http_upgrade;
  }
}
NGINXEOF

  # Mover para local correto
  sudo mv /tmp/nginx_frontend_${instancia_add}.conf /etc/nginx/sites-available/${instancia_add}-frontend
  
  # Criar link simbólico se não existir
  if [ ! -L "/etc/nginx/sites-enabled/${instancia_add}-frontend" ]; then
    sudo ln -s /etc/nginx/sites-available/${instancia_add}-frontend /etc/nginx/sites-enabled/
  fi
  
  echo -e "${SUCCESS_COLOR}✅ Nginx frontend configurado: ${frontend_hostname}${RESET_COLOR}"

  sleep 2
}
