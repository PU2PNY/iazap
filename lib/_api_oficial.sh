#!/bin/bash
#
# functions for setting up WhatsApp Official API (Meta Business API)
#######################################

# Variáveis globais para API Oficial
install_api_oficial="n"
api_oficial_url=""
api_oficial_port="6000"
api_oficial_db_name=""

#######################################
# Pergunta se deseja instalar API Oficial
# Arguments:
#   None
#######################################
get_api_oficial_option() {
  print_banner
  printf "${WHITE} 💻 Deseja instalar a API Oficial do WhatsApp (Meta Business API)?${GRAY_LIGHT}"
  printf "\n\n"
  printf "   A API Oficial permite integração com o WhatsApp Business API da Meta.\n"
  printf "   Requer configuração adicional no Meta Business Suite.\n"
  printf "\n"
  printf "   [S] Sim, instalar API Oficial\n"
  printf "   [N] Não, pular esta etapa\n"
  printf "\n"
  read -p "> " install_api_oficial
  
  # Normalizar resposta
  install_api_oficial=$(echo "$install_api_oficial" | tr '[:upper:]' '[:lower:]')
  
  if [[ "$install_api_oficial" == "s" || "$install_api_oficial" == "sim" || "$install_api_oficial" == "y" || "$install_api_oficial" == "yes" ]]; then
    install_api_oficial="s"
    get_api_oficial_url
    get_api_oficial_port
  else
    install_api_oficial="n"
  fi
}

#######################################
# Pergunta o domínio da API Oficial
# Arguments:
#   None
#######################################
get_api_oficial_url() {
  print_banner
  printf "${WHITE} 💻 Digite o domínio da API OFICIAL para a ${instancia_add}:${GRAY_LIGHT}"
  printf "\n\n"
  printf "   Exemplo: apioficial.seudominio.com.br\n"
  printf "\n"
  read -p "> " api_oficial_url
}

#######################################
# Pergunta a porta da API Oficial
# Arguments:
#   None
#######################################
get_api_oficial_port() {
  print_banner
  printf "${WHITE} 💻 Digite a porta da API OFICIAL para a ${instancia_add}; Ex: 6000 A 6999 (padrão: 6000)${GRAY_LIGHT}"
  printf "\n\n"
  read -p "> " api_oficial_port
  
  # Usar padrão se vazio
  if [ -z "$api_oficial_port" ]; then
    api_oficial_port="6000"
  fi
}

#######################################
# Cria banco de dados para API Oficial
# Arguments:
#   None
#######################################
api_oficial_db_create() {
  print_banner
  printf "${WHITE} 💻 Criando banco de dados para API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2
  
  api_oficial_db_name="${instancia_add}_apioficial"
  
  log_message "INFO" "Criando banco de dados PostgreSQL para API Oficial: ${api_oficial_db_name}"

  sudo su - root <<EOF
  sudo su - postgres <<'PGEOF'
  createdb ${api_oficial_db_name};
  psql ${api_oficial_db_name} <<'SQLEOF'
  CREATE USER ${api_oficial_db_name} SUPERUSER INHERIT CREATEDB CREATEROLE;
  ALTER USER ${api_oficial_db_name} PASSWORD '${mysql_root_password}';
SQLEOF
PGEOF
EOF

  log_message "SUCCESS" "Banco de dados ${api_oficial_db_name} criado com sucesso"
  
  sleep 2
}

#######################################
# Clona/Extrai arquivos da API Oficial
# Arguments:
#   None
#######################################
api_oficial_setup_files() {
  print_banner
  printf "${WHITE} 💻 Configurando arquivos da API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2
  
  log_message "INFO" "Copiando arquivos da API Oficial"
  
  # Criar diretório
  sudo mkdir -p /home/deploy/${instancia_add}/api_oficial
  sudo chown deploy:deploy /home/deploy/${instancia_add}/api_oficial
  
  # Copiar arquivos da API Oficial do instalador
  if [ -d "${PROJECT_ROOT}/api_oficial" ]; then
    sudo cp -r ${PROJECT_ROOT}/api_oficial/* /home/deploy/${instancia_add}/api_oficial/
    sudo chown -R deploy:deploy /home/deploy/${instancia_add}/api_oficial
    log_message "SUCCESS" "Arquivos da API Oficial copiados com sucesso"
  else
    log_message "ERROR" "Pasta api_oficial não encontrada no instalador"
    echo -e "${ERROR_COLOR}❌ ERRO: Pasta api_oficial não encontrada em ${PROJECT_ROOT}${RESET_COLOR}"
    echo -e "${INFO_COLOR}ℹ️  Verifique se a pasta api_oficial está presente no instalador.${RESET_COLOR}"
    return 1
  fi
  
  sleep 2
}

#######################################
# Configura variáveis de ambiente da API Oficial
# Arguments:
#   None
#######################################
api_oficial_set_env() {
  print_banner
  printf "${WHITE} 💻 Configurando variáveis de ambiente (API Oficial)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2
  
  log_message "INFO" "Configurando .env da API Oficial"

  # Normalizar URL
  api_oficial_url=$(echo "${api_oficial_url/https:\/\/}")
  api_oficial_url=${api_oficial_url%%/*}
  api_oficial_url=https://$api_oficial_url
  
  # Normalizar backend_url para URL_BACKEND_MULT100
  local backend_url_normalized=$(echo "${backend_url/https:\/\/}")
  backend_url_normalized=${backend_url_normalized%%/*}
  backend_url_normalized=https://$backend_url_normalized
  
  # Gerar token admin aleatório
  local token_admin=$(openssl rand -hex 32)

sudo su - deploy << EOF
  cat <<[-]EOF > /home/deploy/${instancia_add}/api_oficial/.env
# API Oficial - WhatsApp Meta Business API
NODE_ENV=production
PORT=${api_oficial_port}

# URL Pública da API (para geração do webhook)
API_URL=${api_oficial_url}

# Banco de Dados PostgreSQL
DATABASE_LINK=postgresql://${api_oficial_db_name}:${mysql_root_password}@localhost:5432/${api_oficial_db_name}

# Token de Administração
TOKEN_ADMIN=${token_admin}

# URL do Backend Principal (para WebSocket)
URL_BACKEND_MULT100=${backend_url_normalized}

# Redis
REDIS_URI=redis://:${mysql_root_password}@127.0.0.1:${redis_port}

# RabbitMQ (opcional - desabilitado por padrão)
RABBITMQ_ENABLED_GLOBAL=false
RABBITMQ_URL=amqp://guest:guest@localhost:5672

[-]EOF
EOF

  log_message "SUCCESS" "Variáveis de ambiente da API Oficial configuradas"
  
  # Salvar token para exibição posterior
  echo "$token_admin" > /tmp/api_oficial_token_${instancia_add}.txt
  
  sleep 2
}

#######################################
# Instala dependências Node.js da API Oficial
# Arguments:
#   None
#######################################
api_oficial_node_dependencies() {
  print_banner
  printf "${WHITE} 💻 Instalando dependências da API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando instalação das dependências da API Oficial"
  
  # Verificar se package.json existe
  check_file_exists "/home/deploy/${instancia_add}/api_oficial/package.json" "package.json da API Oficial"
  
  # Instalar dependências
  run_with_check "Instalação de dependências da API Oficial (npm install)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/api_oficial && npm install --force'"
  
  # Verificar se node_modules foi criado
  check_dir_exists "/home/deploy/${instancia_add}/api_oficial/node_modules" "node_modules da API Oficial"
  
  log_message "SUCCESS" "Dependências da API Oficial instaladas com sucesso"

  sleep 2
}

#######################################
# Compila a API Oficial
# Arguments:
#   None
#######################################
api_oficial_node_build() {
  print_banner
  printf "${WHITE} 💻 Compilando API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Compilando API Oficial"
  
  # Gerar Prisma Client
  run_with_check "Gerando Prisma Client" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/api_oficial && npx prisma generate'"
  
  # Compilar código
  run_with_check "Compilação do código da API Oficial (npm run build)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/api_oficial && npm run build'"
  
  # Verificar se dist foi criado
  check_dir_exists "/home/deploy/${instancia_add}/api_oficial/dist" "Pasta dist compilada da API Oficial"
  check_file_exists "/home/deploy/${instancia_add}/api_oficial/dist/main.js" "main.js compilado"
  
  log_message "SUCCESS" "API Oficial compilada com sucesso"

  sleep 2
}

#######################################
# Executa migrations do Prisma
# Arguments:
#   None
#######################################
api_oficial_db_migrate() {
  print_banner
  printf "${WHITE} 💻 Executando migrations da API Oficial (Prisma)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Executando migrations do Prisma"
  
  run_with_check "Execução das migrations (npx prisma migrate deploy)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/api_oficial && npx prisma migrate deploy'"
  
  log_message "SUCCESS" "Migrations da API Oficial executadas com sucesso"

  sleep 2
}

#######################################
# Inicia API Oficial com PM2
# Arguments:
#   None
#######################################
api_oficial_start_pm2() {
  print_banner
  printf "${WHITE} 💻 Iniciando PM2 (API Oficial)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando API Oficial com PM2"
  
  run_with_check "Iniciar API Oficial no PM2" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/api_oficial && pm2 start dist/main.js --name ${instancia_add}-apioficial'"
  
  # Verificar se PM2 está realmente online
  check_pm2_online "${instancia_add}-apioficial"
  
  # Salvar configuração PM2
  sudo su - deploy -c "pm2 save"
  
  log_message "SUCCESS" "API Oficial iniciada com sucesso no PM2"

  sleep 2
}

#######################################
# Configura Nginx para API Oficial
# Arguments:
#   None
#######################################
api_oficial_nginx_setup() {
  print_banner
  printf "${WHITE} 💻 Configurando Nginx (API Oficial)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  api_oficial_hostname=$(echo "${api_oficial_url/https:\/\/}")
  
  log_message "INFO" "Configurando Nginx para: ${api_oficial_hostname}"

  # Criar arquivo de configuração em /tmp primeiro
  cat > /tmp/nginx_apioficial_${instancia_add}.conf << NGINXEOF
server {
  server_name ${api_oficial_hostname};
  
  location / {
    proxy_pass http://127.0.0.1:${api_oficial_port};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_cache_bypass \$http_upgrade;
    
    # Timeout aumentado para uploads de mídia
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    
    # Limite de upload aumentado
    client_max_body_size 50M;
  }
}
NGINXEOF

  # Mover para local correto
  sudo mv /tmp/nginx_apioficial_${instancia_add}.conf /etc/nginx/sites-available/${instancia_add}-apioficial
  
  # Criar link simbólico se não existir
  if [ ! -L "/etc/nginx/sites-enabled/${instancia_add}-apioficial" ]; then
    sudo ln -s /etc/nginx/sites-available/${instancia_add}-apioficial /etc/nginx/sites-enabled/
  fi
  
  echo -e "${SUCCESS_COLOR}✅ Nginx API Oficial configurado: ${api_oficial_hostname}${RESET_COLOR}"
  
  log_message "SUCCESS" "Nginx configurado para API Oficial"

  sleep 2
}

#######################################
# Configura SSL para API Oficial
# Arguments:
#   None
#######################################
api_oficial_certbot_setup() {
  print_banner
  printf "${WHITE} 💻 Configurando SSL para API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  api_oficial_hostname=$(echo "${api_oficial_url/https:\/\/}")
  
  log_message "INFO" "Obtendo certificado SSL para: ${api_oficial_hostname}"

  # Obter certificado SSL
  sudo certbot --nginx --non-interactive --agree-tos -m admin@${api_oficial_hostname} -d ${api_oficial_hostname} 2>/dev/null || \
  sudo certbot --nginx -d ${api_oficial_hostname}
  
  log_message "SUCCESS" "SSL configurado para API Oficial"

  sleep 2
}

#######################################
# Exibe informações da API Oficial instalada
# Arguments:
#   None
#######################################
api_oficial_show_info() {
  print_banner
  printf "${WHITE} ✅ API Oficial instalada com sucesso!${GRAY_LIGHT}"
  printf "\n\n"
  
  # Recuperar token salvo
  local token_admin=""
  if [ -f "/tmp/api_oficial_token_${instancia_add}.txt" ]; then
    token_admin=$(cat /tmp/api_oficial_token_${instancia_add}.txt)
    rm -f /tmp/api_oficial_token_${instancia_add}.txt
  fi
  
  api_oficial_hostname=$(echo "${api_oficial_url/https:\/\/}")
  
  printf "${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET_COLOR}\n"
  printf "${GREEN}║          API OFICIAL DO WHATSAPP - INFORMAÇÕES               ║${RESET_COLOR}\n"
  printf "${GREEN}╠══════════════════════════════════════════════════════════════╣${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} URL:           ${WHITE}https://${api_oficial_hostname}${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} Porta:         ${WHITE}${api_oficial_port}${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} Banco:         ${WHITE}${api_oficial_db_name}${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} PM2 Process:   ${WHITE}${instancia_add}-apioficial${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} Swagger:       ${WHITE}https://${api_oficial_hostname}/swagger${RESET_COLOR}\n"
  printf "${GREEN}╠══════════════════════════════════════════════════════════════╣${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} TOKEN ADMIN:   ${YELLOW}${token_admin}${RESET_COLOR}\n"
  printf "${GREEN}╠══════════════════════════════════════════════════════════════╣${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} ${CYAN}Webhook Meta:${RESET_COLOR}\n"
  printf "${GREEN}║${RESET_COLOR} ${WHITE}https://${api_oficial_hostname}/v1/webhook/{companyId}/{conexaoId}${RESET_COLOR}\n"
  printf "${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET_COLOR}\n"
  printf "\n"
  printf "${YELLOW}⚠️  IMPORTANTE: Guarde o TOKEN ADMIN em local seguro!${RESET_COLOR}\n"
  printf "${YELLOW}   Ele é necessário para autenticação na API.${RESET_COLOR}\n"
  printf "\n"
  
  # Salvar informações em arquivo
  cat > /home/deploy/${instancia_add}/API_OFICIAL_INFO.txt << INFOEOF
=======================================================
API OFICIAL DO WHATSAPP - INFORMAÇÕES DE ACESSO
=======================================================

URL:            https://${api_oficial_hostname}
Porta:          ${api_oficial_port}
Banco:          ${api_oficial_db_name}
PM2 Process:    ${instancia_add}-apioficial
Swagger:        https://${api_oficial_hostname}/swagger

TOKEN ADMIN:    ${token_admin}

Webhook Meta:
https://${api_oficial_hostname}/v1/webhook/{companyId}/{conexaoId}

=======================================================
GUARDE ESTAS INFORMAÇÕES EM LOCAL SEGURO!
=======================================================
INFOEOF

  sudo chown deploy:deploy /home/deploy/${instancia_add}/API_OFICIAL_INFO.txt
  
  sleep 5
}

#######################################
# Cria a empresa padrão na API Oficial
# IMPORTANTE: Sem isso, a conexão WhatsApp Oficial não funciona!
# Arguments:
#   None
#######################################
api_oficial_create_company() {
  print_banner
  printf "${WHITE} 💻 Criando empresa padrão na API Oficial...${GRAY_LIGHT}"
  printf "\n\n"
  
  sleep 2
  
  log_message "INFO" "Criando empresa na API Oficial"
  
  # Obter o token da empresa do backend
  local company_token=""
  if [ -f "/home/deploy/${instancia_add}/backend/.env" ]; then
    company_token=$(grep "JWT_SECRET=" /home/deploy/${instancia_add}/backend/.env | cut -d'=' -f2 | head -c 30)
  fi
  
  # Se não encontrou, gerar um token aleatório
  if [ -z "$company_token" ]; then
    company_token=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 30)
  fi
  
  # Criar a empresa na API Oficial
  sudo -u postgres psql -d ${api_oficial_db_name} << SQLEOF
INSERT INTO company (id, name, "idEmpresaMult100", token, create_at, update_at)
VALUES (
  1,
  'Empresa Padrão',
  1,
  '${company_token}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
SQLEOF

  log_message "SUCCESS" "Empresa criada na API Oficial"
  
  sleep 2
}

#######################################
# Atualiza o .env do backend com variáveis da API Oficial
# IMPORTANTE: URL deve incluir https://
# Arguments:
#   None
#######################################
backend_update_api_oficial_token() {
  print_banner
  printf "${WHITE} 💻 Atualizando backend com configurações da API Oficial...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  # Verificar se o token existe
  if [ -f "/tmp/api_oficial_token_${instancia_add}.txt" ]; then
    local token_api_oficial=$(cat /tmp/api_oficial_token_${instancia_add}.txt)
    
    # Normalizar a URL da API Oficial (garantir https://)
    local api_oficial_url_normalized=$(echo "${api_oficial_url/https:\/\/}")
    api_oficial_url_normalized=${api_oficial_url_normalized%%/*}
    api_oficial_url_normalized="https://$api_oficial_url_normalized"
    
    # Atualizar o .env do backend
    if grep -q "TOKEN_API_OFICIAL=" /home/deploy/${instancia_add}/backend/.env; then
      # Atualizar token existente
      sed -i "s|TOKEN_API_OFICIAL=.*|TOKEN_API_OFICIAL=${token_api_oficial}|" /home/deploy/${instancia_add}/backend/.env
      sed -i "s|URL_API_OFICIAL=.*|URL_API_OFICIAL=${api_oficial_url_normalized}|" /home/deploy/${instancia_add}/backend/.env
    else
      # Adicionar variáveis se não existirem
      echo "" >> /home/deploy/${instancia_add}/backend/.env
      echo "# API Oficial WhatsApp Meta" >> /home/deploy/${instancia_add}/backend/.env
      echo "USE_WHATSAPP_OFICIAL=true" >> /home/deploy/${instancia_add}/backend/.env
      echo "URL_API_OFICIAL=${api_oficial_url_normalized}" >> /home/deploy/${instancia_add}/backend/.env
      echo "TOKEN_API_OFICIAL=${token_api_oficial}" >> /home/deploy/${instancia_add}/backend/.env
    fi
    
    # Reiniciar o backend para aplicar as mudanças
    sudo su - deploy -c "pm2 restart ${instancia_add}-backend --update-env" 2>/dev/null || true
    
    printf "${GREEN}✅ Backend atualizado com configurações da API Oficial!${GRAY_LIGHT}\n"
    log_message "SUCCESS" "Backend atualizado com TOKEN_API_OFICIAL e URL_API_OFICIAL"
  else
    printf "${YELLOW}⚠️ Token da API Oficial não encontrado.${GRAY_LIGHT}\n"
    log_message "WARN" "Token da API Oficial não encontrado"
  fi
  
  sleep 2
}

#######################################
# Função principal para instalar API Oficial
# Deve ser chamada apenas se install_api_oficial == "s"
# Arguments:
#   None
#######################################
api_oficial_install_all() {
  if [[ "$install_api_oficial" != "s" ]]; then
    log_message "INFO" "Instalação da API Oficial pulada (usuário optou por não instalar)"
    return 0
  fi
  
  print_banner
  printf "${WHITE} 💻 Iniciando instalação da API Oficial do WhatsApp...${GRAY_LIGHT}"
  printf "\n\n"
  
  sleep 2
  
  # Executar todas as etapas
  api_oficial_db_create
  api_oficial_setup_files
  api_oficial_set_env
  api_oficial_node_dependencies
  api_oficial_node_build
  api_oficial_db_migrate
  api_oficial_create_company          # NOVO: Criar empresa na API Oficial
  api_oficial_start_pm2
  api_oficial_nginx_setup
  backend_update_api_oficial_token    # NOVO: Atualizar backend com variáveis
  
  # SSL será configurado junto com os outros domínios
  
  log_message "SUCCESS" "API Oficial instalada com sucesso"
}

#######################################
# Configura SSL da API Oficial (chamado junto com certbot geral)
# Arguments:
#   None
#######################################
api_oficial_certbot() {
  if [[ "$install_api_oficial" != "s" ]]; then
    return 0
  fi
  
  api_oficial_certbot_setup
}

#######################################
# Exibe informações da API Oficial (chamado no final)
# Arguments:
#   None
#######################################
api_oficial_show_final_info() {
  if [[ "$install_api_oficial" != "s" ]]; then
    return 0
  fi
  
  api_oficial_show_info
}
