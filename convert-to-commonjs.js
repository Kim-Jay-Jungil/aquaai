#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'api');

// ES 모듈을 CommonJS로 변환하는 함수
function convertToCommonJS(content) {
  // export default function -> module.exports
  let converted = content.replace(
    /export\s+default\s+function\s+(\w+)/g,
    'module.exports = function $1'
  );
  
  // export default -> module.exports
  converted = converted.replace(
    /export\s+default\s+/g,
    'module.exports = '
  );
  
  // import -> require 변환 (간단한 경우)
  converted = converted.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,
    'const $1 = require("$2");'
  );
  
  return converted;
}

// API 디렉토리의 모든 .js 파일을 변환
function convertAllFiles() {
  try {
    const files = fs.readdirSync(apiDir);
    
    files.forEach(file => {
      if (file.endsWith('.js') && !file.includes('commonjs')) {
        const filePath = path.join(apiDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // ES 모듈 문법이 있는지 확인
        if (content.includes('export default') || content.includes('import ')) {
          const converted = convertToCommonJS(content);
          
          // 백업 파일 생성
          const backupPath = filePath + '.backup';
          fs.writeFileSync(backupPath, content);
          
          // 변환된 내용으로 파일 덮어쓰기
          fs.writeFileSync(filePath, converted);
          
          console.log(`✅ ${file} 변환 완료 (백업: ${file}.backup)`);
        } else {
          console.log(`⏭️  ${file} - 변환 불필요 (이미 CommonJS)`);
        }
      }
    });
    
    console.log('\n🎉 모든 API 파일 변환 완료!');
    console.log('이제 Vercel에 배포해보세요.');
    
  } catch (error) {
    console.error('❌ 변환 중 오류 발생:', error.message);
  }
}

// 스크립트 실행
convertAllFiles();
