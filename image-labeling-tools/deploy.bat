@echo off
setlocal enabledelayedexpansion

REM 图像标注工具集 - Windows自动化部署脚本
REM 作者: yhsnba
REM 版本: 1.0.0

title 图像标注工具集 - 自动化部署

REM 颜色定义
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 显示横幅
echo %BLUE%
echo ==================================================
echo     🚀 图像标注工具集 - 自动化部署脚本
echo ==================================================
echo %NC%

REM 检查Docker是否安装
echo %BLUE%[INFO]%NC% 检查系统要求...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker 未安装，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker Compose 未安装，请先安装 Docker Compose
    echo 安装指南: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% Docker 和 Docker Compose 已安装

REM 检查端口占用
echo %BLUE%[INFO]%NC% 检查端口占用...
netstat -an | findstr ":5174" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% 端口 5174 已被占用
    set /p continue="是否继续部署？(y/N): "
    if /i not "!continue!"=="y" (
        echo %RED%[ERROR]%NC% 部署已取消
        pause
        exit /b 1
    )
) else (
    echo %GREEN%[SUCCESS]%NC% 端口 5174 可用
)

netstat -an | findstr ":3004" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% 端口 3004 已被占用
    set /p continue="是否继续部署？(y/N): "
    if /i not "!continue!"=="y" (
        echo %RED%[ERROR]%NC% 部署已取消
        pause
        exit /b 1
    )
) else (
    echo %GREEN%[SUCCESS]%NC% 端口 3004 可用
)

REM 创建环境配置
echo %BLUE%[INFO]%NC% 创建环境配置...
if not exist .env (
    (
        echo # 服务器配置
        echo PORT=3004
        echo NODE_ENV=production
        echo.
        echo # 前端配置
        echo VITE_API_BASE_URL=http://localhost:3004/api
        echo.
        echo # 安全配置
        echo CORS_ORIGIN=http://localhost:5174
        echo.
        echo # 文件上传配置
        echo MAX_FILE_SIZE=52428800
        echo UPLOAD_DIR=uploads
        echo.
        echo # 调试配置
        echo DEBUG=false
        echo LOG_LEVEL=info
    ) > .env
    echo %GREEN%[SUCCESS]%NC% 已创建 .env 配置文件
) else (
    echo %BLUE%[INFO]%NC% .env 文件已存在，跳过创建
)

REM 创建必要目录
echo %BLUE%[INFO]%NC% 创建必要目录...
if not exist uploads mkdir uploads
if not exist server\data mkdir server\data
if not exist logs mkdir logs

REM 创建 .gitkeep 文件
echo. > uploads\.gitkeep
echo. > server\data\.gitkeep
echo. > logs\.gitkeep

echo %GREEN%[SUCCESS]%NC% 目录创建完成

REM 处理命令行参数
set "command=%1"
if "%command%"=="" set "command=deploy"

if "%command%"=="deploy" goto :deploy
if "%command%"=="stop" goto :stop
if "%command%"=="restart" goto :restart
if "%command%"=="logs" goto :logs
if "%command%"=="status" goto :status
if "%command%"=="clean" goto :clean
if "%command%"=="help" goto :help
if "%command%"=="-h" goto :help
if "%command%"=="--help" goto :help

echo %RED%[ERROR]%NC% 未知命令: %command%
echo 使用 '%~nx0 help' 查看帮助
pause
exit /b 1

:deploy
echo %BLUE%[INFO]%NC% 构建和启动服务...

REM 停止现有服务
docker-compose down >nul 2>&1

REM 构建镜像
echo %BLUE%[INFO]%NC% 构建 Docker 镜像...
docker-compose build --no-cache
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 镜像构建失败
    pause
    exit /b 1
)

REM 启动服务
echo %BLUE%[INFO]%NC% 启动服务...
docker-compose up -d
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 服务启动失败
    docker-compose logs
    pause
    exit /b 1
)

REM 等待服务启动
echo %BLUE%[INFO]%NC% 等待服务启动...
timeout /t 10 /nobreak >nul

REM 健康检查
echo %BLUE%[INFO]%NC% 执行健康检查...

REM 检查后端API
set /a count=0
:check_backend
set /a count+=1
curl -f http://localhost:3004/health >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[SUCCESS]%NC% 后端API健康检查通过
    goto :check_frontend
)

if !count! geq 30 (
    echo %RED%[ERROR]%NC% 后端API健康检查失败
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% 等待后端API启动... (!count!/30)
timeout /t 2 /nobreak >nul
goto :check_backend

:check_frontend
set /a count=0
:check_frontend_loop
set /a count+=1
curl -f http://localhost:5174 >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[SUCCESS]%NC% 前端健康检查通过
    goto :show_info
)

if !count! geq 30 (
    echo %RED%[ERROR]%NC% 前端健康检查失败
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% 等待前端启动... (!count!/30)
timeout /t 2 /nobreak >nul
goto :check_frontend_loop

:show_info
echo.
echo %GREEN%[SUCCESS]%NC% 🎉 部署完成！
echo.
echo 访问地址:
echo   前端界面: http://localhost:5174
echo   后端API:  http://localhost:3004
echo   健康检查: http://localhost:3004/health
echo.
echo 管理命令:
echo   查看状态: %~nx0 status
echo   查看日志: %~nx0 logs
echo   停止服务: %~nx0 stop
echo   重启服务: %~nx0 restart
echo.
echo 数据目录:
echo   上传文件: .\uploads\
echo   项目数据: .\server\data\
echo   日志文件: .\logs\
echo.
pause
exit /b 0

:stop
echo %BLUE%[INFO]%NC% 停止服务...
docker-compose down
echo %GREEN%[SUCCESS]%NC% 服务已停止
pause
exit /b 0

:restart
echo %BLUE%[INFO]%NC% 重启服务...
docker-compose restart
echo %GREEN%[SUCCESS]%NC% 服务已重启
pause
exit /b 0

:logs
docker-compose logs -f
exit /b 0

:status
docker-compose ps
pause
exit /b 0

:clean
echo %YELLOW%[WARNING]%NC% 这将删除所有容器和镜像
set /p confirm="确定要继续吗？(y/N): "
if /i "!confirm!"=="y" (
    docker-compose down -v --rmi all
    echo %GREEN%[SUCCESS]%NC% 清理完成
)
pause
exit /b 0

:help
echo 用法: %~nx0 [命令]
echo.
echo 命令:
echo   deploy   部署服务 (默认)
echo   stop     停止服务
echo   restart  重启服务
echo   logs     查看日志
echo   status   查看状态
echo   clean    清理所有数据
echo   help     显示帮助
echo.
pause
exit /b 0
