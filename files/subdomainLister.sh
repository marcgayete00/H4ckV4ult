#!/bin/bash
DOMAIN="thetoppers.htb"
IP="10.129.227.248"
WORDLIST="/home/kali/Downloads/n0kovo_subdomains_large.txt"
FAKE_SUB="noexist123"

# Obtener el hash de una respuesta falsa para comparar
BASE_HASH=$(curl -s -H "Host: $FAKE_SUB.$DOMAIN" http://$IP | sha1sum | awk '{print $1}')

echo "[*] Hash base (subdominio falso): $BASE_HASH"
echo "[*] Escaneando posibles subdominios diferentes..."

while read -r SUB; do
    HOST="$SUB.$DOMAIN"
    BODY=$(curl -s -H "Host: $HOST" http://$IP)
    HASH=$(echo "$BODY" | sha1sum | awk '{print $1}')

    if [ "$HASH" != "$BASE_HASH" ]; then
        echo "[+] Subdominio potencial: $HOST (hash diferente: $HASH)"
    fi
done < "$WORDLIST"
