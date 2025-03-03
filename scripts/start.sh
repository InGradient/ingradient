#!/bin/bash

# Python 서버 실행
cd ingradient
uvicorn app:app --reload --host 0.0.0.0 --port 8000 &
cd ..

# Next.js 개발 서버 실행
cd web
npm install
npm run dev