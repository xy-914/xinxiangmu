@echo off
chcp 936 >nul 2>nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "ROOT=%CD%"
set "PY=%ROOT%\.venv\Scripts\python.exe"
set "PIP_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple"
REM 与 Python 子进程控制台输出保持一致，避免中文乱码
set "PYTHONIOENCODING=gbk"
set "PYTHONUTF8=0"

echo ================================================
echo   辰光 Agent 平台 - 一键启动
echo   数据库: SQLite   缓存: fakeredis   对象存储: 内存模拟
echo ================================================
echo.

REM ==================== 1. Python 环境 ====================
echo [1/5] 检查 Python 环境 ...
set "SYS_PY="
where python >nul 2>&1
if not errorlevel 1 (
    set "SYS_PY=python"
) else (
    where py >nul 2>&1
    if not errorlevel 1 set "SYS_PY=py -3"
)

if not defined SYS_PY (
    echo.
    echo [错误] 未检测到 Python，请安装 Python 3.10 或更高版本。
    echo        安装时请勾选 "Add Python to PATH"。
    echo.
    pause
    exit /b 1
)

REM 版本检查：项目使用了 SQLAlchemy 2.0 / Pydantic v2 的类型化写法
%SYS_PY% -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] Python 版本过低，需要 3.10 或更高版本。
    %SYS_PY% --version
    echo.
    pause
    exit /b 1
)

REM 虚拟环境必须真的能用：.venv 可能来自其他电脑，其 pyvenv.cfg 指向不存在的解释器
set "VENV_OK=0"
if exist "%PY%" (
    "%PY%" -c "import sys" >nul 2>&1
    if not errorlevel 1 set "VENV_OK=1"
)

if "!VENV_OK!"=="0" (
    if exist "%ROOT%\.venv" (
        echo       现有 .venv 不可用（解释器缺失或已失效），正在重建 ...
        rmdir /s /q "%ROOT%\.venv" 2>nul
    ) else (
        echo       首次运行，正在创建虚拟环境 .venv ...
    )
    %SYS_PY% -m venv "%ROOT%\.venv"
    if errorlevel 1 (
        echo.
        echo [错误] 虚拟环境创建失败，请确认 Python 安装完整。
        pause
        exit /b 1
    )
    if not exist "%PY%" (
        echo.
        echo [错误] 虚拟环境创建后未找到 python.exe，请检查 .venv 目录。
        pause
        exit /b 1
    )
    echo       虚拟环境创建完成
) else (
    echo       虚拟环境已经存在
)

REM ==================== 2. 后端依赖 ====================
echo [2/5] 检查后端依赖 ...
"%PY%" -c "import fastapi, uvicorn, aiosqlite, fakeredis, alembic, sqlalchemy, minio" >nul 2>&1
if errorlevel 1 (
    echo       正在安装后端依赖（首次运行可能需要几分钟）...
    "%PY%" -m pip install -r requirements.txt -i %PIP_INDEX%
    if errorlevel 1 (
        echo       镜像源安装失败，改用官方源重试 ...
        "%PY%" -m pip install -r requirements.txt
    )
    if errorlevel 1 (
        echo.
        echo [错误] 后端依赖安装失败。可手动切换镜像源后重试：
        echo        "%PY%" -m pip config set global.index-url %PIP_INDEX%
        echo.
        pause
        exit /b 1
    )
)
echo       依赖检查通过

REM ==================== 3. 数据库 ====================
echo [3/5] 准备数据库 ...
"%PY%" bootstrap_db.py
if errorlevel 1 (
    echo.
    echo [错误] 数据库初始化失败，请查看上方日志。
    pause
    exit /b 1
)

REM ==================== 4. 前端依赖 ====================
echo [4/5] 检查前端依赖 ...
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 未检测到 npm，请安装 Node.js 18 或更高版本。
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%\app\node_modules" (
    echo       首次运行，正在安装 npm 依赖（请耐心等待）...
    pushd "%ROOT%\app"
    call npm.cmd install
    set "NPM_RC=!ERRORLEVEL!"
    popd
    if not "!NPM_RC!"=="0" (
        echo.
        echo [错误] npm 依赖安装失败，请检查网络或 npm 源。
        pause
        exit /b 1
    )
) else (
    echo       前端依赖已经存在
)

REM ==================== 5. 启动服务 ====================
echo [5/5] 启动服务 ...

call :port_busy 8080
if "!BUSY!"=="1" (
    echo       端口 8080 已被占用，跳过后端启动（可能已在运行）
) else (
    start "辰光Agent-后端 8080" cmd /k "cd /d ""%ROOT%"" && ""%PY%"" -m uvicorn src.main:app --host 127.0.0.1 --port 8080"
    echo       后端启动中 ...
)

call :port_busy 5173
if "!BUSY!"=="1" (
    echo       端口 5173 已被占用，跳过前端启动（可能已在运行）
) else (
    start "辰光Agent-前端 5173" cmd /k "cd /d ""%ROOT%\app"" && npm.cmd run dev"
    echo       前端启动中 ...
)

echo.
echo       等待服务就绪 ...
"%PY%" wait_ready.py 120
set "READY=!ERRORLEVEL!"

echo.
echo ================================================
echo   后端 API 文档: http://localhost:8080/docs
echo   健康检查:      http://localhost:8080/health
echo   前端界面:      http://localhost:5173
echo   默认账号:      admin / 123456
echo.
if "!READY!"=="0" (
    echo   启动完成，正在打开浏览器 ...
    start "" "http://localhost:5173"
) else (
    echo   有服务尚未就绪，请查看对应窗口的报错日志排查。
)
echo.
echo   停止服务：直接关闭对应的两个命令行窗口即可
echo ================================================
echo.
pause
exit /b 0

REM ==================== 子程序：检查端口占用 ====================
:port_busy
set "BUSY=0"
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul 2>&1
if not errorlevel 1 set "BUSY=1"
exit /b 0
