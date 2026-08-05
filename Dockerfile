# 四福车间管理系统 - Docker 镜像构建文件
# 适用平台：x86_64 / amd64（绿联 4600 为 Intel N5105，兼容）
# 说明：本系统仅依赖 Node.js 内置模块，无需 npm install；
#       前端 Excel 导出库已随项目打包（public/js/vendor/），无需联网安装。

FROM node:22-bookworm-slim

# 工作目录
WORKDIR /app

# 仅拷贝运行所需文件（不含开发用的 data.db、node 缓存等）
COPY server.js ./
COPY public ./public
COPY data ./data

# 数据库与数据文件统一放在 /app/data（DATA_DIR 由 docker-compose 注入）
ENV DATA_DIR=/app/data
ENV PORT=8090
EXPOSE 8090

# Node 22 的 node:sqlite 仍需 --experimental-sqlite 开关
CMD ["node", "--experimental-sqlite", "server.js"]
