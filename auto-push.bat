@echo off

set MAX_RETRIES=5
set RETRY_COUNT=0
set RETRY_INTERVAL=5

:retry_loop
if %RETRY_COUNT% geq %MAX_RETRIES% (
    echo 推送失败，已达到最大重试次数 %MAX_RETRIES%。
    exit /b 1
)

set /a RETRY_COUNT+=1
echo 尝试推送 (第 !RETRY_COUNT! 次 / 共 %MAX_RETRIES% 次)...

git push
if %errorlevel% equ 0 (
    echo 推送成功！
    goto :eof
) else (
    echo 推送失败，错误码: %errorlevel%。等待 %RETRY_INTERVAL% 秒后重试...
    timeout /t %RETRY_INTERVAL% /nobreak >nul
    goto retry_loop
)