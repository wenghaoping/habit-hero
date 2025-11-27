# 自定义图标文件夹

这个文件夹用于自定义应用的图标，映射到 Docker 容器的 `/app/dist/icons` 目录。

## 使用方法

1. 将您的自定义图标文件放在这个文件夹中
2. 文件名必须为：`apple-touch-icon.png`（180x180 像素的 PNG 图片）
3. 重新部署 Docker 容器：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 图标要求

- **apple-touch-icon.png**: 180x180 像素，PNG 格式，用于 iOS 主屏幕图标
- **app-icon.svg**: SVG 格式的应用图标（可选）

## 当前映射

- 本地目录：`./icons`
- 容器目录：`/app/dist/icons`
- 访问路径：`http://localhost:4000/icons/apple-touch-icon.png`

## 注意事项

- 修改图标后需要重新启动容器才能生效
- 建议图标尺寸为 180x180 像素以获得最佳显示效果
- 支持 PNG 格式，确保背景透明或与应用主题匹配

