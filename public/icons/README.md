将下列图标文件放在本目录，用于网页 favicon、PWA 与 iOS 桌面图标：

- app-icon-192.png（192×192，PNG）
- app-icon-512.png（512×512，PNG）
- apple-touch-icon.png（180×180，PNG）

来源图片：你提供的“习惯小英雄”图。建议：
- 保持白底与圆角，或去除圆角交由系统自动处理均可；
- 图标主体尽量居中，四周留白便于不同设备裁切；
- 如果需自动生成，可用下述命令行方案（macOS 示例）：

1) 将原图保存为 `source.png`（至少 512×512）
2) 运行：
   - 192×192：`sips -z 192 192 source.png --out app-icon-192.png`
   - 512×512：`sips -z 512 512 source.png --out app-icon-512.png`
   - 180×180：`sips -z 180 180 source.png --out apple-touch-icon.png`

完成后，刷新页面即可显示图标；PWA 安装或“添加到主屏幕”会使用这些资源。