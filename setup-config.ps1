# 配置文件设置脚本 (PowerShell)
# 从 config.yaml.example 创建 config.yaml 文件

# 切换到脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($scriptPath) {
    Set-Location $scriptPath
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "设置配置文件" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "当前目录: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# 检查 config.yaml.example 是否存在
if (-not (Test-Path "config.yaml.example")) {
    Write-Host "[错误] config.yaml.example 文件不存在" -ForegroundColor Red
    Write-Host "当前目录: $(Get-Location)" -ForegroundColor Red
    Write-Host "请确保在项目根目录运行此脚本" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

# 检查 config.yaml 是否已存在
if (Test-Path "config.yaml") {
    Write-Host "[警告] config.yaml 文件已存在" -ForegroundColor Yellow
    $overwrite = Read-Host "是否要覆盖？(Y/N)"
    if ($overwrite -ne "Y" -and $overwrite -ne "y") {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit 0
    }
}

# 复制 config.yaml.example 到 config.yaml
try {
    Copy-Item "config.yaml.example" "config.yaml" -Force
    Write-Host "[成功] 已创建 config.yaml 文件" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "1. 编辑 config.yaml 文件，填入必要的配置" -ForegroundColor White
    Write-Host "2. 至少需要配置以下项：" -ForegroundColor White
    Write-Host "   - database.supabase_url" -ForegroundColor Yellow
    Write-Host "   - database.supabase_key" -ForegroundColor Yellow
    Write-Host "   - database.supabase_secret" -ForegroundColor Yellow
    Write-Host "   - apis.openai.api_key" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. 然后运行应用或构建 Docker 镜像" -ForegroundColor White
    Write-Host ""
    
    # 询问是否打开文件
    $open = Read-Host "是否现在打开 config.yaml 文件进行编辑？(Y/N)"
    if ($open -eq "Y" -or $open -eq "y") {
        notepad config.yaml
    }
} catch {
    Write-Host "[错误] 创建 config.yaml 文件失败: $_" -ForegroundColor Red
    exit 1
}

