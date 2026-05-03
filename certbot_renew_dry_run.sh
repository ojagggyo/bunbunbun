#!/bin/bash
echo 注意！！！
echo ホームゲートウェイ詳細設定->ポートマッピング設定
echo ポート80のIPアドレスを正しく設定する。
echo http://192.168.0.1/
echo パスワード: Vision2020

echo 証明書の期限
PEM=/etc/letsencrypt/live/bun.steememory.com/fullchain.pem
sudo openssl x509 -in ${PEM} -noout -dates

echo 証明書更新（シミュレーション）
sudo certbot renew --dry-run
