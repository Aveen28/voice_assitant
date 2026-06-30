@echo off
setlocal

set "NODE_EXE="

for /f "delims=" %%I in ('where node.exe 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%I"
)

if not defined NODE_EXE (
  for /d %%D in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v*-win-x64") do (
    if exist "%%~fD\node.exe" set "NODE_EXE=%%~fD\node.exe"
  )
)

if not defined NODE_EXE (
  echo Node.js was not found. Restart PowerShell or reinstall Node.js LTS.
  exit /b 1
)

"%NODE_EXE%" "%~dp0node_modules\vite\bin\vite.js" %*
