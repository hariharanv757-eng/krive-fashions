@echo off
echo Starting KRIVE FASHIONS Full-Stack Platform...
start "KRIVE Spring Boot API" cmd /k "cd backend && mvn spring-boot:run"
start "KRIVE React Storefront" cmd /k "npm run dev"
timeout /t 5
start http://localhost:5173