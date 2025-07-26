#!/bin/bash

# 图像标注工具集 - 自动化部署脚本
# 作者: yhsnba
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    🚀 图像标注工具集 - 自动化部署脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    log_success "操作系统: $OS"
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        echo "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        echo "安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_success "Docker 和 Docker Compose 已安装"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    PORTS=(5174 3004)
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 $port 已被占用"
            read -p "是否继续部署？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "部署已取消"
                exit 1
            fi
        else
            log_success "端口 $port 可用"
        fi
    done
}

# 创建环境配置
create_env_config() {
    log_info "创建环境配置..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# 服务器配置
PORT=3004
NODE_ENV=production

# 前端配置
VITE_API_BASE_URL=http://localhost:3004/api

# 安全配置
CORS_ORIGIN=http://localhost:5174

# 文件上传配置
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads

# 调试配置
DEBUG=false
LOG_LEVEL=info
EOF
        log_success "已创建 .env 配置文件"
    else
        log_info ".env 文件已存在，跳过创建"
    fi
}

# 创建数据目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p uploads
    mkdir -p server/data
    mkdir -p logs
    
    # 创建 .gitkeep 文件
    touch uploads/.gitkeep
    touch server/data/.gitkeep
    touch logs/.gitkeep
    
    log_success "目录创建完成"
}

# 构建和启动服务
deploy_services() {
    log_info "构建和启动服务..."
    
    # 停止现有服务
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查后端API
    for i in {1..30}; do
        if curl -f http://localhost:3004/health >/dev/null 2>&1; then
            log_success "后端API健康检查通过"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "后端API健康检查失败"
            exit 1
        fi
        
        log_info "等待后端API启动... ($i/30)"
        sleep 2
    done
    
    # 检查前端
    for i in {1..30}; do
        if curl -f http://localhost:5174 >/dev/null 2>&1; then
            log_success "前端健康检查通过"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "前端健康检查失败"
            exit 1
        fi
        
        log_info "等待前端启动... ($i/30)"
        sleep 2
    done
}

# 显示部署信息
show_deployment_info() {
    echo
    log_success "🎉 部署完成！"
    echo
    echo "访问地址:"
    echo "  前端界面: http://localhost:5174"
    echo "  后端API:  http://localhost:3004"
    echo "  健康检查: http://localhost:3004/health"
    echo
    echo "管理命令:"
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo
    echo "数据目录:"
    echo "  上传文件: ./uploads/"
    echo "  项目数据: ./server/data/"
    echo "  日志文件: ./logs/"
    echo
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 这里可以添加清理逻辑
}

# 错误处理
error_handler() {
    log_error "部署过程中发生错误"
    log_info "查看详细日志: docker-compose logs"
    cleanup
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap error_handler ERR
    trap cleanup EXIT
    
    show_banner
    
    # 检查参数
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            check_ports
            create_env_config
            create_directories
            deploy_services
            health_check
            show_deployment_info
            ;;
        "stop")
            log_info "停止服务..."
            docker-compose down
            log_success "服务已停止"
            ;;
        "restart")
            log_info "重启服务..."
            docker-compose restart
            health_check
            log_success "服务已重启"
            ;;
        "logs")
            docker-compose logs -f
            ;;
        "status")
            docker-compose ps
            ;;
        "clean")
            log_warning "这将删除所有容器和镜像"
            read -p "确定要继续吗？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose down -v --rmi all
                log_success "清理完成"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令]"
            echo
            echo "命令:"
            echo "  deploy   部署服务 (默认)"
            echo "  stop     停止服务"
            echo "  restart  重启服务"
            echo "  logs     查看日志"
            echo "  status   查看状态"
            echo "  clean    清理所有数据"
            echo "  help     显示帮助"
            ;;
        *)
            log_error "未知命令: $1"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
