#!/bin/bash

echo "🏡 home 폴더 구조 리팩토링 시작..."

# 1. shared 디렉토리 생성 후 공통 UI 컴포넌트 이동
mkdir -p shared
for file in headerSection.jsx memberGridSection.jsx userBottomSheet.jsx; do
  if [ -f "$file" ]; then
    mv "$file" shared/
    echo "✅ $file → shared/"
  fi
done

# 2. hooks 디렉토리 생성 후 useLogout.jsx 이동
mkdir -p hooks
if [ -f "setting/useLogout.jsx" ]; then
  mv setting/useLogout.jsx hooks/
  echo "✅ useLogout.jsx → hooks/"
fi

# 3. index.jsx 삭제
if [ -f "index.jsx" ]; then
  rm index.jsx
  echo "🗑️ index.jsx 삭제"
fi

echo "🎉 home 폴더 리팩토링 완료!"
