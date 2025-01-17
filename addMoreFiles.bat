@echo off
REM Create main directories
mkdir src\components\auth
mkdir src\lib\auth
mkdir src\lib\api
mkdir src\lib\config
mkdir src\pages\api\auth
mkdir src\pages\auth

REM Create component files
type nul > src\components\auth\GoogleAuthButton.tsx
type nul > src\components\auth\AuthStatus.tsx

REM Create lib files
type nul > src\lib\auth\google.ts
type nul > src\lib\auth\types.ts
type nul > src\lib\api\gmail.ts
type nul > src\lib\api\endpoints.ts
type nul > src\lib\config\constants.ts
type nul > src\lib\config\auth.ts

REM Create page files
type nul > src\pages\api\auth\google.ts
type nul > src\pages\auth\callback.tsx

echo Directory structure and files created successfully!
pause