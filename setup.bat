@echo off
echo Creating project structure...

:: Create directories
mkdir src\lib\agents\controller
mkdir src\lib\agents\strategic
mkdir src\lib\agents\tactical
mkdir src\lib\agents\operational

:: Create type files
type nul > src\lib\types\agents.ts
type nul > src\lib\types\store.ts

:: Create agent files
type nul > src\lib\agents\index.ts
type nul > src\lib\agents\controller\index.ts
type nul > src\lib\agents\controller\store.ts
type nul > src\lib\agents\strategic\index.ts
type nul > src\lib\agents\strategic\handlers.ts
type nul > src\lib\agents\tactical\index.ts
type nul > src\lib\agents\tactical\handlers.ts
type nul > src\lib\agents\operational\index.ts
type nul > src\lib\agents\operational\handlers.ts

echo Done!