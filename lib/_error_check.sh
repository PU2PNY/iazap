#!/bin/bash
#
# Error checking and logging functions

# Cores para mensagens
readonly ERROR_COLOR="\033[1;31m"
readonly SUCCESS_COLOR="\033[1;32m"
readonly WARNING_COLOR="\033[1;33m"
readonly INFO_COLOR="\033[1;36m"
readonly RESET_COLOR="\033[0m"

# Arquivo de log - será definido em init_log após instancia_add estar disponível
LOG_FILE=""

#######################################
# Inicializa o sistema de log
# Arguments:
#   None
#######################################
init_log() {
  # Definir LOG_FILE aqui quando instancia_add já está disponível
  LOG_FILE="/var/log/instalador_atendechat_${instancia_add}_$(date +%Y%m%d_%H%M%S).log"
  mkdir -p /var/log
  touch "$LOG_FILE"
  chmod 644 "$LOG_FILE"
  echo "=== INSTALAÇÃO INICIADA: $(date) ===" >> "$LOG_FILE"
  echo "Instância: ${instancia_add}" >> "$LOG_FILE"
  echo "========================================" >> "$LOG_FILE"
}

#######################################
# Registra mensagem no log
# Arguments:
#   $1 - Tipo (INFO|SUCCESS|WARNING|ERROR)
#   $2 - Mensagem
#######################################
log_message() {
  local type=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$type] $message" >> "$LOG_FILE"
}

#######################################
# Exibe erro e para instalação
# Arguments:
#   $1 - Mensagem de erro
#   $2 - Comando que falhou
#   $3 - Código de saída
#######################################
error_exit() {
  local error_msg=$1
  local failed_command=$2
  local exit_code=$3
  
  echo ""
  echo -e "${ERROR_COLOR}╔════════════════════════════════════════════════════════════════╗${RESET_COLOR}"
  echo -e "${ERROR_COLOR}║                     ❌ ERRO NA INSTALAÇÃO                      ║${RESET_COLOR}"
  echo -e "${ERROR_COLOR}╚════════════════════════════════════════════════════════════════╝${RESET_COLOR}"
  echo ""
  echo -e "${ERROR_COLOR}📍 Erro: ${error_msg}${RESET_COLOR}"
  echo -e "${ERROR_COLOR}🔧 Comando: ${failed_command}${RESET_COLOR}"
  echo -e "${ERROR_COLOR}💥 Código de saída: ${exit_code}${RESET_COLOR}"
  echo ""
  echo -e "${WARNING_COLOR}📄 Log completo salvo em:${RESET_COLOR}"
  echo -e "${INFO_COLOR}   ${LOG_FILE}${RESET_COLOR}"
  echo ""
  echo -e "${WARNING_COLOR}📋 Para ver o log completo:${RESET_COLOR}"
  echo -e "${INFO_COLOR}   tail -100 ${LOG_FILE}${RESET_COLOR}"
  echo ""
  echo -e "${WARNING_COLOR}📝 Para copiar o erro:${RESET_COLOR}"
  echo -e "${INFO_COLOR}   cat ${LOG_FILE}${RESET_COLOR}"
  echo ""
  
  log_message "ERROR" "Instalação abortada: $error_msg"
  log_message "ERROR" "Comando falhou: $failed_command"
  log_message "ERROR" "Exit code: $exit_code"
  
  echo -e "${ERROR_COLOR}⛔ Instalação ABORTADA!${RESET_COLOR}"
  echo ""
  
  exit 1
}

#######################################
# Verifica código de saída do último comando
# Arguments:
#   $1 - Descrição da etapa
#   $2 - Comando executado (opcional)
#######################################
check_error() {
  local exit_code=$?
  local step_description=$1
  local command=${2:-"comando anterior"}
  
  if [ $exit_code -ne 0 ]; then
    error_exit "$step_description" "$command" "$exit_code"
  else
    log_message "SUCCESS" "$step_description - OK"
  fi
}

#######################################
# Verifica sucesso do comando anterior (alias para check_error)
# Arguments:
#   $1 - Descrição da etapa
#######################################
check_success() {
  local step_description=$1
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    error_exit "$step_description" "comando anterior" "$exit_code"
  else
    echo -e "${SUCCESS_COLOR}✅ ${step_description} - OK${RESET_COLOR}"
    log_message "SUCCESS" "$step_description - OK"
  fi
}

#######################################
# Executa comando com verificação de erro
# Arguments:
#   $1 - Descrição da etapa
#   $2 - Comando a executar
#######################################
run_with_check() {
  local description=$1
  local command=$2
  
  echo -e "${INFO_COLOR}⏳ ${description}...${RESET_COLOR}"
  log_message "INFO" "Executando: $description"
  log_message "INFO" "Comando: $command"
  
  # Executar comando e capturar saída
  local output
  output=$(eval "$command" 2>&1)
  local exit_code=$?
  
  # Registrar saída no log
  echo "$output" >> "$LOG_FILE"
  
  # Verificar se houve erro
  if [ $exit_code -ne 0 ]; then
    echo ""
    echo -e "${ERROR_COLOR}❌ FALHOU: ${description}${RESET_COLOR}"
    echo ""
    echo -e "${WARNING_COLOR}📤 Saída do comando:${RESET_COLOR}"
    echo -e "${INFO_COLOR}${output}${RESET_COLOR}"
    echo ""
    error_exit "$description" "$command" "$exit_code"
  else
    echo -e "${SUCCESS_COLOR}✅ ${description} - OK${RESET_COLOR}"
    log_message "SUCCESS" "$description completado com sucesso"
  fi
}

#######################################
# Verifica se arquivo existe
# Arguments:
#   $1 - Caminho do arquivo
#   $2 - Descrição do arquivo
#######################################
check_file_exists() {
  local file_path=$1
  local file_description=$2
  
  if [ ! -f "$file_path" ]; then
    error_exit "Arquivo não encontrado: $file_description" "Verificação de $file_path" "1"
  fi
  
  log_message "SUCCESS" "Arquivo encontrado: $file_path"
}

#######################################
# Verifica se diretório existe
# Arguments:
#   $1 - Caminho do diretório
#   $2 - Descrição do diretório
#######################################
check_dir_exists() {
  local dir_path=$1
  local dir_description=$2
  
  if [ ! -d "$dir_path" ]; then
    error_exit "Diretório não encontrado: $dir_description" "Verificação de $dir_path" "1"
  fi
  
  log_message "SUCCESS" "Diretório encontrado: $dir_path"
}

#######################################
# Verifica se serviço está rodando
# Arguments:
#   $1 - Nome do serviço
#######################################
check_service_running() {
  local service_name=$1
  
  if ! systemctl is-active --quiet "$service_name"; then
    error_exit "Serviço não está rodando: $service_name" "systemctl status $service_name" "1"
  fi
  
  log_message "SUCCESS" "Serviço rodando: $service_name"
}

#######################################
# Verifica se porta está em uso
# Arguments:
#   $1 - Número da porta
#   $2 - Descrição da porta
#######################################
check_port_in_use() {
  local port=$1
  local description=$2
  
  if netstat -tuln | grep -q ":${port} "; then
    error_exit "Porta já em uso: $port ($description)" "netstat -tuln | grep :$port" "1"
  fi
  
  log_message "SUCCESS" "Porta disponível: $port"
}

#######################################
# Verifica se PM2 está online
# Arguments:
#   $1 - Nome do processo PM2
#######################################
check_pm2_online() {
  local process_name=$1
  
  echo -e "${INFO_COLOR}⏳ Verificando PM2: ${process_name}...${RESET_COLOR}"
  
  sleep 5  # Aguardar processo iniciar
  
  # Verificar se processo existe no PM2
  local process_exists=$(sudo su - deploy -c "pm2 list" | grep -c "${process_name}")
  
  if [ "$process_exists" -eq 0 ]; then
    echo ""
    echo -e "${ERROR_COLOR}❌ Processo PM2 não encontrado: ${process_name}${RESET_COLOR}"
    echo ""
    echo -e "${WARNING_COLOR}📋 Lista de processos PM2:${RESET_COLOR}"
    sudo su - deploy -c "pm2 list"
    echo ""
    error_exit "PM2 processo não iniciou: $process_name" "pm2 start" "1"
  fi
  
  # Verificar se status contém "online" (método simples e confiável)
  local pm2_status=$(sudo su - deploy -c "pm2 show ${process_name}" | grep "status" | head -1)
  
  if echo "$pm2_status" | grep -q "online"; then
    echo -e "${SUCCESS_COLOR}✅ PM2 online: ${process_name}${RESET_COLOR}"
    log_message "SUCCESS" "PM2 processo online: $process_name"
  else
    echo ""
    echo -e "${ERROR_COLOR}❌ Processo PM2 não está online: ${process_name}${RESET_COLOR}"
    echo -e "${ERROR_COLOR}   ${pm2_status}${RESET_COLOR}"
    echo ""
    echo -e "${WARNING_COLOR}📋 Detalhes do processo:${RESET_COLOR}"
    sudo su - deploy -c "pm2 show ${process_name}"
    echo ""
    echo -e "${WARNING_COLOR}📄 Últimas 50 linhas do log de erro:${RESET_COLOR}"
    sudo su - deploy -c "pm2 logs ${process_name} --err --lines 50 --nostream"
    echo ""
    error_exit "PM2 processo não está online" "pm2 start $process_name" "1"
  fi
}

#######################################
# Mostra resumo de sucesso
# Arguments:
#   None
#######################################
show_success() {
  echo ""
  echo -e "${SUCCESS_COLOR}╔════════════════════════════════════════════════════════════════╗${RESET_COLOR}"
  echo -e "${SUCCESS_COLOR}║              ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!              ║${RESET_COLOR}"
  echo -e "${SUCCESS_COLOR}╚════════════════════════════════════════════════════════════════╝${RESET_COLOR}"
  echo ""
  echo -e "${SUCCESS_COLOR}🎉 Instância: ${instancia_add}${RESET_COLOR}"
  echo -e "${SUCCESS_COLOR}🌐 Frontend: ${frontend_url}${RESET_COLOR}"
  echo -e "${SUCCESS_COLOR}🔧 Backend: ${backend_url}${RESET_COLOR}"
  echo ""
  echo -e "${INFO_COLOR}📄 Log completo: ${LOG_FILE}${RESET_COLOR}"
  echo ""
  
  log_message "SUCCESS" "Instalação concluída com sucesso!"
  echo "=== INSTALAÇÃO CONCLUÍDA: $(date) ===" >> "$LOG_FILE"
}
