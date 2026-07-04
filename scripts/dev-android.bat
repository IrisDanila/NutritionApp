@echo off
REM Build + install NutriLife to the connected device and launch it.
REM Start Metro first in another terminal:  npm start
REM Usage (from project root):  scripts\dev-android.bat

cd /d "%~dp0..\android" || exit /b 1

REM Trust the Windows cert store so HTTPS works behind the corporate proxy
REM (only matters when Gradle downloads something).
set GRADLE_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT

REM Keep BOTH the project cache (--project-cache-dir) and the Gradle home (-g)
REM off the user profile, so the corporate EDR (Cortex XDR) can't block
REM Gradle's atomic file renames (dependency transforms live in the home).
call gradlew.bat app:installDebug --project-cache-dir C:\gradle-nl\proj -g C:\gradle-nl\home
if errorlevel 1 (
  echo.
  echo Build/install failed.
  exit /b 1
)

REM Let the app reach Metro over USB, then launch it.
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.nutrilife/.MainActivity
echo.
echo Done - NutriLife launched. Keep "npm start" running for live reload.
