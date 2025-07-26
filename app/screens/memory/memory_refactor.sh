#!/bin/bash

echo "📦 memory 구조 리팩토링 시작합니다..."

# 1. components → shared 로 이동
if [ -d "components" ]; then
  mv components shared
  echo "✅ 'components/' → 'shared/' 로 변경"
fi

# 2. post/components → modules/post/components 로 이동
if [ -d "post/components" ]; then
  mkdir -p modules/post
  mv post/components modules/post/
  echo "✅ 'post/components/' → 'modules/post/components/' 로 이동"
fi

# 3. post/deleteOptionModal.jsx → modules/post/deleteOptionModal.jsx 로 이동
if [ -f "post/deleteOptionModal.jsx" ]; then
  mv post/deleteOptionModal.jsx modules/post/deleteOptionModal.jsx
  echo "✅ 'post/deleteOptionModal.jsx' → 'modules/post/' 로 이동"
fi

# 4. upload/ → modules/upload/ 로 이동
if [ -d "upload" ]; then
  mkdir -p modules/upload
  mv upload/* modules/upload/
  rmdir upload
  echo "✅ 'upload/' 내부 파일 → 'modules/upload/' 로 이동"
fi

# 5. albumTabSelector.jsx → shared/ 로 이동
if [ -f "albumTabSelector.jsx" ]; then
  mv albumTabSelector.jsx shared/
  echo "✅ 'albumTabSelector.jsx' → 'shared/' 로 이동"
fi

# 6. index.jsx 삭제 (불필요 시)
if [ -f "index.jsx" ]; then
  rm index.jsx
  echo "🗑️ 'index.jsx' 삭제"
fi

echo "🎉 모든 리팩토링이 완료되었습니다!"
