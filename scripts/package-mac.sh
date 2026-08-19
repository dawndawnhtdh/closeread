#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_APP="/Users/mac/Documents/New project/node_modules/electron/dist/Electron.app"
RELEASE_DIR="$PROJECT_DIR/release"
APP_PATH="$RELEASE_DIR/CloseRead.app"
ICON_TMP="$PROJECT_DIR/.icon-build"
ICONSET="$ICON_TMP/CloseRead.iconset"
PLIST="$APP_PATH/Contents/Info.plist"

if [[ ! -d "$ELECTRON_APP" ]]; then
  echo "未找到本机 Electron.app：$ELECTRON_APP" >&2
  exit 1
fi

cd "$PROJECT_DIR"
npm run build

rm -rf "$RELEASE_DIR" "$ICON_TMP"
mkdir -p "$RELEASE_DIR" "$ICONSET"

node "$PROJECT_DIR/scripts/generate-icon.mjs" "$ICON_TMP/closeread-icon.ppm"
sips -s format png "$ICON_TMP/closeread-icon.ppm" --out "$ICON_TMP/closeread-icon.png" >/dev/null
SOURCE_PNG="$ICON_TMP/closeread-icon.png"

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$SOURCE_PNG" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z "$double" "$double" "$SOURCE_PNG" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done

node "$PROJECT_DIR/scripts/generate-icns.mjs" "$ICONSET" "$ICON_TMP/CloseRead.icns"
cp -R "$ELECTRON_APP" "$APP_PATH"

mv "$APP_PATH/Contents/MacOS/Electron" "$APP_PATH/Contents/MacOS/CloseRead"
cp "$ICON_TMP/CloseRead.icns" "$APP_PATH/Contents/Resources/CloseRead.icns"
rm -f "$APP_PATH/Contents/Resources/default_app.asar"
rm -rf "$APP_PATH/Contents/Resources/app" "$APP_PATH/Contents/Resources/app.asar.unpacked"
mkdir -p "$APP_PATH/Contents/Resources/app/desktop"

cp -R "$PROJECT_DIR/dist" "$APP_PATH/Contents/Resources/app/dist"
cp "$PROJECT_DIR/desktop/main.js" "$APP_PATH/Contents/Resources/app/desktop/main.js"
cp "$PROJECT_DIR/desktop/preload.cjs" "$APP_PATH/Contents/Resources/app/desktop/preload.cjs"

cat > "$APP_PATH/Contents/Resources/app/package.json" <<'JSON'
{
  "name": "closeread-english",
  "version": "1.0.1",
  "type": "module",
  "main": "desktop/main.js"
}
JSON

/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable CloseRead" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.closeread.english" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleName CloseRead" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName CloseRead" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleIconFile CloseRead.icns" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 1.0.1" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 2" "$PLIST"

codesign --force --deep --sign - "$APP_PATH" >/dev/null
rm -rf "$ICON_TMP"

echo "$APP_PATH"
