#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# npm run build # 如果你有 frontend build 需求才開，目前後端不需要

# 下載 Puppeteer 所需的瀏覽器
npx puppeteer browsers install chrome
