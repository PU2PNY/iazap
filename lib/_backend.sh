#!/bin/bash
#
# functions for setting up app backend
#######################################
# creates REDIS db using docker
# Arguments:
#   None
#######################################
backend_redis_create() {
  print_banner
  printf "${WHITE} 💻 Criando Redis & Banco Postgres...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  sudo su - root <<EOF
  usermod -aG docker deploy
  docker run --name redis-${instancia_add} -p ${redis_port}:6379 --restart always --detach redis redis-server --requirepass ${mysql_root_password}
EOF
  
  sleep 2
  
  # Compilar e instalar uuid-ossp extension
  echo ""
  echo -e "${INFO_COLOR}🔧 Configurando uuid-ossp extension...${RESET_COLOR}"
  echo ""
  
  sudo su - root <<'UUIDEOF'
  # Tentar compilar uuid-ossp em diferentes localizações possíveis
  
  # Localização 1: /usr/share/postgresql
  if [ -d "/usr/share/postgresql" ]; then
    UUID_CONTRIB=$(find /usr/share/postgresql -name "uuid-ossp" -type d 2>/dev/null | head -1)
    if [ ! -z "$UUID_CONTRIB" ]; then
      echo "📦 Encontrado uuid-ossp em: $UUID_CONTRIB"
      cd "$UUID_CONTRIB"
      if [ -f "Makefile" ]; then
        make 2>/dev/null && make install 2>/dev/null && echo "✅ uuid-ossp compilado com sucesso"
      fi
    fi
  fi
  
  # Localização 2: /usr/lib/postgresql
  if [ -d "/usr/lib/postgresql" ]; then
    UUID_CONTRIB=$(find /usr/lib/postgresql -name "uuid-ossp" -type d 2>/dev/null | head -1)
    if [ ! -z "$UUID_CONTRIB" ]; then
      echo "📦 Encontrado uuid-ossp em: $UUID_CONTRIB"
      cd "$UUID_CONTRIB"
      if [ -f "Makefile" ]; then
        make 2>/dev/null && make install 2>/dev/null && echo "✅ uuid-ossp compilado com sucesso"
      fi
    fi
  fi
  
  # Localização 3: /usr/local/pgsql (se instalado manualmente)
  if [ -d "/usr/local/pgsql/contrib/uuid-ossp" ]; then
    echo "📦 Encontrado uuid-ossp em: /usr/local/pgsql/contrib/uuid-ossp"
    cd /usr/local/pgsql/contrib/uuid-ossp
    if [ -f "Makefile" ]; then
      make 2>/dev/null && make install 2>/dev/null && echo "✅ uuid-ossp compilado com sucesso"
    fi
  fi
  
  # Ajustar permissões se diretório aaPanel existir
  if [ -d "/www/server/pgsql/share/extension/" ]; then
    chown postgres:postgres /www/server/pgsql/share/extension/uuid* 2>/dev/null && echo "✅ Permissões ajustadas"
  fi
UUIDEOF

  sleep 1
  
  # Criar banco de dados e extension
  sudo su - root <<EOF
  sudo su - postgres <<'PGEOF'
  createdb ${instancia_add};
  psql ${instancia_add} <<'SQLEOF'
  CREATE USER ${instancia_add} SUPERUSER INHERIT CREATEDB CREATEROLE;
  ALTER USER ${instancia_add} PASSWORD '${mysql_root_password}';
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQLEOF
PGEOF
EOF

  sleep 2

}

#######################################
# sets environment variable for backend.
# Arguments:
#   None
#######################################
backend_set_env() {
  print_banner
  printf "${WHITE} 💻 Configurando variáveis de ambiente (backend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  # ensure idempotency
  backend_url=$(echo "${backend_url/https:\/\/}")
  backend_url=${backend_url%%/*}
  backend_url=https://$backend_url

  # ensure idempotency
  frontend_url=$(echo "${frontend_url/https:\/\/}")
  frontend_url=${frontend_url%%/*}
  frontend_url=https://$frontend_url

sudo su - deploy << EOF
  cat <<[-]EOF > /home/deploy/${instancia_add}/backend/.env
NODE_ENV=
BACKEND_URL=${backend_url}
FRONTEND_URL=${frontend_url}
PROXY_PORT=443
PORT=${backend_port}

DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=${instancia_add}
DB_PASS=${mysql_root_password}
DB_NAME=${instancia_add}

JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}

REDIS_URI=redis://:${mysql_root_password}@127.0.0.1:${redis_port}
REDIS_OPT_LIMITER_MAX=1
REGIS_OPT_LIMITER_DURATION=3000

USER_LIMIT=${max_user}
CONNECTIONS_LIMIT=${max_whats}
CLOSED_SEND_BY_ME=true

[-]EOF
EOF

  sleep 2
}

#######################################
# installs node.js dependencies
# Arguments:
#   None
#######################################
backend_node_dependencies() {
  print_banner
  printf "${WHITE} 💻 Instalando dependências do backend...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando instalação das dependências do backend"
  
  # Verificar se package.json existe
  check_file_exists "/home/deploy/${instancia_add}/backend/package.json" "package.json do backend"
  
  # Instalar dependências
  run_with_check "Instalação de dependências do backend (npm install)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/backend && npm install --force'"
  
  # Verificar se node_modules foi criado
  check_dir_exists "/home/deploy/${instancia_add}/backend/node_modules" "node_modules do backend"
  
  # Compilar código
  run_with_check "Compilação do código backend (npm run build)" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/backend && npm run build'"
  
  # Verificar se dist foi criado
  check_dir_exists "/home/deploy/${instancia_add}/backend/dist" "Pasta dist compilada"
  check_file_exists "/home/deploy/${instancia_add}/backend/dist/server.js" "server.js compilado"
  
  log_message "SUCCESS" "Dependências do backend instaladas com sucesso"

  sleep 2
}

#######################################
# compiles backend code
# Arguments:
#   None
#######################################
backend_node_build() {
  print_banner
  printf "${WHITE} 💻 Backend compilado com sucesso!${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2
  
  # Build já foi executado em backend_node_dependencies
}

#######################################
# updates frontend code
# Arguments:
#   None
#######################################
backend_update() {
  print_banner
  printf "${WHITE} 💻 Atualizando o backend...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  sudo su - deploy <<EOF
  cd /home/deploy/${empresa_atualizar}
  pm2 stop ${empresa_atualizar}-backend
  git pull
  cd /home/deploy/${empresa_atualizar}/backend
  npm install --force
  rm -rf dist 
  npm run build
  npm run db:migrate
  npm run db:seed
  pm2 start ${empresa_atualizar}-backend
  pm2 save 
EOF

  sleep 2
}

#######################################
# configura sequelize para usar .env ao invés de config.json
# Arguments:
#   None
#######################################
backend_sequelize_config() {
  print_banner
  printf "${WHITE} 💻 Configurando Sequelize...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Criando arquivos de configuração do Sequelize"
  
  # Criar diretório config se não existir
  echo -e "${INFO_COLOR}📁 Criando diretório config...${RESET_COLOR}"
  sudo mkdir -p /home/deploy/${instancia_add}/backend/config
  sudo chown deploy:deploy /home/deploy/${instancia_add}/backend/config
  
  # Criar config/database.js usando método robusto (via /tmp)
  echo -e "${INFO_COLOR}📝 Criando config/database.js...${RESET_COLOR}"
  
  cat > /tmp/database_config_${instancia_add}.js << 'DBCONFIG'
require('dotenv').config();

module.exports = {
  development: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin',
    },
  },
  test: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin',
    },
  },
  production: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin',
    },
  },
};
DBCONFIG

  sudo mv /tmp/database_config_${instancia_add}.js /home/deploy/${instancia_add}/backend/config/database.js
  sudo chown deploy:deploy /home/deploy/${instancia_add}/backend/config/database.js
  
  check_file_exists "/home/deploy/${instancia_add}/backend/config/database.js" "Arquivo config/database.js"
  
  # Criar .sequelizerc na raiz do backend usando método robusto
  echo -e "${INFO_COLOR}📝 Criando .sequelizerc...${RESET_COLOR}"
  
  cat > /tmp/sequelizerc_${instancia_add}.js << 'SEQUELIZERC'
const path = require('path');

module.exports = {
  'config': path.resolve('dist', 'config', 'database.js'),
  'models-path': path.resolve('dist', 'models'),
  'seeders-path': path.resolve('dist', 'database', 'seeds'),
  'migrations-path': path.resolve('dist', 'database', 'migrations')
};
SEQUELIZERC

  sudo mv /tmp/sequelizerc_${instancia_add}.js /home/deploy/${instancia_add}/backend/.sequelizerc
  sudo chown deploy:deploy /home/deploy/${instancia_add}/backend/.sequelizerc
  
  check_file_exists "/home/deploy/${instancia_add}/backend/.sequelizerc" "Arquivo .sequelizerc"
  
  # Verificar se pastas necessárias existem
  echo ""
  echo -e "${INFO_COLOR}🔍 Verificando estrutura do projeto...${RESET_COLOR}"
  echo ""
  
  check_dir_exists "/home/deploy/${instancia_add}/backend/src" "Pasta src"
  
  # Verificar pastas opcionais (não falhar se não existirem)
  if [ -d "/home/deploy/${instancia_add}/backend/src/models" ]; then
    echo -e "${SUCCESS_COLOR}✅ Pasta src/models encontrada${RESET_COLOR}"
  fi
  
  if [ -d "/home/deploy/${instancia_add}/backend/src/database" ]; then
    echo -e "${SUCCESS_COLOR}✅ Pasta src/database encontrada${RESET_COLOR}"
  fi
  
  log_message "SUCCESS" "Sequelize configurado com sucesso"

  sleep 2
}

#######################################
# runs db migrate
# Arguments:
#   None
#######################################
backend_db_migrate() {
  print_banner
  printf "${WHITE} 💻 Executando db:migrate...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Executando migrations do banco de dados"
  
  # Tentar com npm run primeiro, se falhar usa npx sequelize diretamente
  sudo su - deploy -c "cd /home/deploy/${instancia_add}/backend && npm run db:migrate 2>/dev/null || npx sequelize db:migrate"
  
  if [ $? -eq 0 ]; then
    printf "${GREEN}✅ Migrations executadas com sucesso!${GRAY_LIGHT}\n"
    log_message "SUCCESS" "Migrations executadas com sucesso"
  else
    printf "${YELLOW}⚠️ Tentando migrations com sequelize-cli...${GRAY_LIGHT}\n"
    sudo su - deploy -c "cd /home/deploy/${instancia_add}/backend && npx sequelize-cli db:migrate"
    if [ $? -eq 0 ]; then
      printf "${GREEN}✅ Migrations executadas com sucesso!${GRAY_LIGHT}\n"
      log_message "SUCCESS" "Migrations executadas com sucesso"
    else
      printf "${RED}❌ Erro ao executar migrations${GRAY_LIGHT}\n"
      log_message "ERROR" "Falha ao executar migrations"
    fi
  fi

  sleep 2
}

#######################################
# runs db seed
# Arguments:
#   None
#######################################
backend_db_seed() {
  print_banner
  printf "${WHITE} 💻 Executando db:seed...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Executando seeds do banco de dados"
  
  # Tentar com npm run primeiro, se falhar usa npx sequelize diretamente
  sudo su - deploy -c "cd /home/deploy/${instancia_add}/backend && npm run db:seed 2>/dev/null || npx sequelize db:seed:all"
  
  if [ $? -eq 0 ]; then
    printf "${GREEN}✅ Seeds executados com sucesso!${GRAY_LIGHT}\n"
    log_message "SUCCESS" "Seeds executados com sucesso"
  else
    printf "${YELLOW}⚠️ Tentando seeds com sequelize-cli...${GRAY_LIGHT}\n"
    sudo su - deploy -c "cd /home/deploy/${instancia_add}/backend && npx sequelize-cli db:seed:all"
    if [ $? -eq 0 ]; then
      printf "${GREEN}✅ Seeds executados com sucesso!${GRAY_LIGHT}\n"
      log_message "SUCCESS" "Seeds executados com sucesso"
    else
      printf "${RED}❌ Erro ao executar seeds${GRAY_LIGHT}\n"
      log_message "ERROR" "Falha ao executar seeds"
    fi
  fi

  sleep 2
}

#######################################
# Cria o Plano e Empresa padrão no banco
# IMPORTANTE: Sem isso, o sistema fica sem plano e empresa!
# Arguments:
#   None
#######################################
backend_create_default_plan_company() {
  print_banner
  printf "${WHITE} 💻 Criando plano e empresa padrão...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Criando plano e empresa padrão no banco de dados"

  # Criar Plano Padrão e atualizar Empresa
  sudo -u postgres psql -d ${instancia_add} << SQLEOF

-- Criar Plano Padrão se não existir (com TODAS as features habilitadas)
INSERT INTO "Plans" (
  name, 
  users, 
  connections, 
  queues,
  amount,
  "useWhatsapp", 
  "useFacebook", 
  "useInstagram", 
  "useCampaigns", 
  "useSchedules", 
  "useInternalChat", 
  "useExternalApi", 
  "useKanban", 
  "useOpenAi", 
  "useIntegrations",
  "createdAt",
  "updatedAt"
)
SELECT 
  'Plano Padrão',
  999,
  999,
  999,
  0,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Plans" WHERE name = 'Plano Padrão'
);

-- Atualizar Plano existente para garantir todas as features
UPDATE "Plans" SET
  users = 999,
  connections = 999,
  queues = 999,
  amount = 0,
  "useWhatsapp" = true,
  "useFacebook" = true,
  "useInstagram" = true,
  "useCampaigns" = true,
  "useSchedules" = true,
  "useInternalChat" = true,
  "useExternalApi" = true,
  "useKanban" = true,
  "useOpenAi" = true,
  "useIntegrations" = true,
  "updatedAt" = NOW()
WHERE id = 1;

-- Atualizar Empresa com o plano e configurações completas
UPDATE "Companies" 
SET 
  "planId" = 1,
  name = 'Empresa Principal',
  email = '${deploy_email}',
  phone = '00000000000',
  status = true,
  "dueDate" = '2099-12-31',
  "recurrence" = 'MENSAL',
  "updatedAt" = NOW()
WHERE id = 1;

-- Habilitar criação de usuários
UPDATE "Settings" 
SET value = 'enabled' 
WHERE key = 'userCreation' AND "companyId" = 1;

-- Garantir que CompaniesSettings está configurado corretamente
UPDATE "CompaniesSettings"
SET 
  "hoursCloseTicketsAuto" = '9999999',
  "DirectTicketsToWallets" = false,
  "closeTicketOnTransfer" = false,
  "updatedAt" = NOW()
WHERE "companyId" = 1;

SQLEOF

  if [ $? -eq 0 ]; then
    printf "${GREEN}✅ Plano e Empresa padrão criados com sucesso!${GRAY_LIGHT}\n"
    log_message "SUCCESS" "Plano e Empresa padrão criados"
  else
    printf "${YELLOW}⚠️ Aviso: Pode ter ocorrido um erro ao criar plano/empresa${GRAY_LIGHT}\n"
    log_message "WARN" "Possível erro ao criar plano/empresa padrão"
  fi

  # Criar pastas public para empresas (evita erro de "Directory does not exist")
  mkdir -p /home/deploy/${instancia_add}/backend/public/company1
  mkdir -p /home/deploy/${instancia_add}/backend/public/company2
  mkdir -p /home/deploy/${instancia_add}/backend/public/company3
  chown -R deploy:deploy /home/deploy/${instancia_add}/backend/public
  log_message "INFO" "Pastas public/company criadas"

  sleep 2
}

#######################################
# starts backend using pm2 in 
# production mode.
# Arguments:
#   None
#######################################
backend_start_pm2() {
  print_banner
  printf "${WHITE} 💻 Iniciando pm2 (backend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Iniciando backend com PM2"
  
  run_with_check "Iniciar backend no PM2" \
    "sudo su - deploy -c 'cd /home/deploy/${instancia_add}/backend && pm2 start dist/server.js --name ${instancia_add}-backend'"
  
  # Verificar se PM2 está realmente online
  check_pm2_online "${instancia_add}-backend"
  
  log_message "SUCCESS" "Backend iniciado com sucesso no PM2"

  sleep 2
}

#######################################
# updates frontend code
# Arguments:
#   None
#######################################
backend_nginx_setup() {
  print_banner
  printf "${WHITE} 💻 Configurando nginx (backend)...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  backend_hostname=$(echo "${backend_url/https:\/\/}")
  
  echo -e "${INFO_COLOR}📝 Criando configuração Nginx para: ${backend_hostname}${RESET_COLOR}"

  # Criar arquivo de configuração em /tmp primeiro (variáveis expandem corretamente)
  cat > /tmp/nginx_backend_${instancia_add}.conf << NGINXEOF
server {
  server_name ${backend_hostname};
  
  location / {
    proxy_pass http://127.0.0.1:${backend_port};
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
  sudo mv /tmp/nginx_backend_${instancia_add}.conf /etc/nginx/sites-available/${instancia_add}-backend
  
  # Criar link simbólico se não existir
  if [ ! -L "/etc/nginx/sites-enabled/${instancia_add}-backend" ]; then
    sudo ln -s /etc/nginx/sites-available/${instancia_add}-backend /etc/nginx/sites-enabled/
  fi
  
  echo -e "${SUCCESS_COLOR}✅ Nginx backend configurado: ${backend_hostname}${RESET_COLOR}"

  sleep 2
}

#######################################
# Configura o usuário master do sistema
# Remove usuários padrão e cria o usuário AtendeChat
# Arguments:
#   None
#######################################
backend_setup_master_user() {
  print_banner
  printf "${WHITE} 💻 Configurando usuário master...${GRAY_LIGHT}"
  printf "\n\n"

  sleep 2

  log_message "INFO" "Configurando usuário master do sistema"

  # Usar SQL direto com hash hardcoded (evita problemas de escape)
  # Hash bcrypt para senha 'chatbot123' gerado com bcrypt.hash('chatbot123', 10)
  sudo -u postgres psql -d ${instancia_add} -c "
UPDATE \"Users\" SET 
  name = 'AtendeChat Admin',
  email = 'atendechat123@gmail.com',
  \"passwordHash\" = '\$2a\$10\$ppKfuD84NiEjRZDyXfk9xOMby.VMBA9nWKa9RUWMl.ttcQHqoS4sG',
  profile = 'admin',
  super = true,
  online = true,
  \"tokenVersion\" = 0,
  \"allTicket\" = 'enabled',
  \"allHistoric\" = 'enabled',
  \"allUserChat\" = 'enabled',
  \"allowGroup\" = true,
  \"defaultTheme\" = 'light',
  \"startWork\" = '00:00',
  \"endWork\" = '23:59',
  \"showDashboard\" = 'enabled',
  \"showCampaign\" = 'enabled',
  \"showContacts\" = 'enabled',
  \"showFlow\" = 'enabled',
  \"allowRealTime\" = 'enabled',
  \"allowConnections\" = 'enabled',
  \"allowSeeMessagesInPendingTickets\" = 'enabled',
  \"updatedAt\" = NOW()
WHERE id = 1;"

  # Verificar resultado
  sudo -u postgres psql -d ${instancia_add} -c "SELECT id, name, email, profile, super FROM \"Users\" WHERE id = 1;"

  if [ $? -eq 0 ]; then
    printf "${GREEN}✅ Usuário master configurado com sucesso!${GRAY_LIGHT}\n"
    echo ""
    echo "========================================"
    echo "   CREDENCIAIS DO USUARIO MASTER"
    echo "========================================"
    echo "   Email: atendechat123@gmail.com"
    echo "   Senha: chatbot123"
    echo "   Perfil: Admin (acesso total)"
    echo "   Permissoes: TODAS HABILITADAS"
    echo "========================================"
    echo ""
    log_message "SUCCESS" "Usuário master configurado com sucesso"
  else
    printf "${YELLOW}⚠️ Aviso: Pode ter ocorrido um erro ao configurar usuário master${GRAY_LIGHT}\n"
    log_message "WARN" "Possível erro ao configurar usuário master"
  fi

  sleep 2
}
