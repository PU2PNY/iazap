#!/bin/bash
#
# Variables to be used for app configuration.

# app variables

jwt_secret=$(openssl rand -base64 32)
jwt_refresh_secret=$(openssl rand -base64 32)

db_pass=$(openssl rand -base64 32)

db_user=$(openssl rand -base64 32)
db_name=$(openssl rand -base64 32)

deploy_email=deploy@deploy.com
deploy_password=deploybotmal

# Link do repositório Git (com token embutido)
link_git="https://atendechat:YOUR_TOKEN_HERE@github.com/atendechat/AtendechatApioffcial.git"
