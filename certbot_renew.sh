#!/bin/bash

sudo certbot renew
if [ $? -ne 0 ]; then
  exit 1
fi

echo 証明書コピー
sudo cp -p -L /etc/letsencrypt/live/bun.steememory.com/fullchain.pem /home/steem/bunbunbun/certs/fullchain.pem
sudo cp -p -L /etc/letsencrypt/live/bun.steememory.com/privkey.pem /home/steem/bunbunbun/certs/privkey.pem

echo 所有者変更
sudo chown steem:steem fullchain.pem
sudo chown steem:steem privkey.pem
