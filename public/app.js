// public/app-new.js - 직접 업로드 방식으로 변경된 버전
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aqua.AI 앱 로딩 시작...');

  // DOM 요소들
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const enhanceButton = document.getElementById('enhanceButton');
  const progressBar = document.getElementById('progressBar');
  const resultsContainer = document.getElementById('resultsContainer');
  const statusMessage = document.getElementById('statusMessage');

  // 상태 변수
  let selectedFiles = [];
  let isProcessing = false;

  // 초기화
  init();

  function init() {
    console.log('🔧 앱 초기화 중...');
    
    // 이벤트 리스너 등록
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    enhanceButton.addEventListener('click', startEnhancement);

    // API 테스트 버튼들
    setupAPITestButtons();
    
    console.log('✅ 앱 초기화 완료');
  }

  function setupAPITestButtons() {
    // 간단 API 테스트
    const simpleTestBtn = document.getElementById('simpleTestBtn');
    if (simpleTestBtn) {
      simpleTestBtn.addEventListener('click', testSimpleAPI);
    }

    // API 테스트
    const apiTestBtn = document.getElementById('apiTestBtn');
    if (apiTestBtn) {
      apiTestBtn.addEventListener('click', testAPI);
    }

    // S3 테스트
    const s3TestBtn = document.getElementById('s3TestBtn');
    if (s3TestBtn) {
      s3TestBtn.addEventListener('click', testS3);
    }

    // 환경변수 확인
    const envCheckBtn = document.getElementById('envCheckBtn');
    if (envCheckBtn) {
      envCheckBtn.addEventListener('click', checkEnvironment);
    }

    // 이미지 URL 테스트
    const imageUrlTestBtn = document.getElementById('imageUrlTestBtn');
    if (imageUrlTestBtn) {
      imageUrlTestBtn.addEventListener('click', testImageUrl);
    }

    // 간단 업로드 테스트
    const simpleUploadTestBtn = document.getElementById('simpleUploadTestBtn');
    if (simpleUploadTestBtn) {
      simpleUploadTestBtn.addEventListener('click', testSimpleUpload);
    }

    // 실제 파일 테스트
    const realFileTestBtn = document.getElementById('realFileTestBtn');
    if (realFileTestBtn) {
      realFileTestBtn.addEventListener('click', testRealFile);
    }

    // API 상태 확인
    const apiStatusBtn = document.getElementById('apiStatusBtn');
    if (apiStatusBtn) {
      apiStatusBtn.addEventListener('click', checkAPIStatus);
    }

    // S3 CORS 테스트
    const s3CorsTestBtn = document.getElementById('s3CorsTestBtn');
    if (s3CorsTestBtn) {
      s3CorsTestBtn.addEventListener('click', testS3Cors);
    }
  }

  // 파일 선택 처리
  function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    console.log('📁 선택된 파일들:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    selectedFiles = files.filter(file => validateFile(file).isValid);
    updateUploadArea();
    updateEnhanceButton();
  }

  // 드래그 앤 드롭 처리
  function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
  }

  function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    console.log('📁 드롭된 파일들:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    selectedFiles = files.filter(file => validateFile(file).isValid);
    updateUploadArea();
    updateEnhanceButton();
  }

  // 파일 검증
  function validateFile(file) {
    const errors = [];
    
    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('파일 크기가 10MB를 초과합니다');
    }
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      errors.push('이미지 파일만 업로드 가능합니다');
    }
    
    // 파일명 검증
    const sanitizedName = sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      console.log('🔍 파일명 정리:', file.name, '→', sanitizedName);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName
    };
  }

  // 파일명 정리
  function sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // 업로드 영역 업데이트
  function updateUploadArea() {
    if (selectedFiles.length === 0) {
      uploadArea.innerHTML = `
        <div class="upload-placeholder">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <strong>파일을 선택하거나 드래그하세요</strong><br>
            <small>이미지 파일만 지원 (최대 10MB)</small>
          </div>
        </div>
      `;
    } else {
      const fileList = selectedFiles.map(file => `
        <div class="file-item">
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
          </div>
          <div class="file-preview">
            <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="preview-image">
          </div>
        </div>
      `).join('');
      
      uploadArea.innerHTML = `
        <div class="selected-files">
          <h4>선택된 파일 (${selectedFiles.length}개)</h4>
          <div class="file-preview-grid">
            ${fileList}
          </div>
        </div>
      `;
    }
  }

  // 파일 크기 포맷팅
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 향상 버튼 업데이트
  function updateEnhanceButton() {
    enhanceButton.disabled = selectedFiles.length === 0 || isProcessing;
    enhanceButton.textContent = isProcessing ? '처리 중...' : '이미지 보정 시작';
  }

  // 진행률 바 표시/숨김
  function showProgressBar() {
    progressBar.style.display = 'block';
    progressBar.style.width = '0%';
  }

  function hideProgressBar() {
    progressBar.style.display = 'none';
  }

  function updateProgress(percent) {
    progressBar.style.width = percent + '%';
  }

  // 이미지 보정 시작
  async function startEnhancement() {
    if (selectedFiles.length === 0 || isProcessing) return;
    
    isProcessing = true;
    updateEnhanceButton();
    showProgressBar();
    clearResults();
    
    console.log('🚀 이미지 보정 시작:', selectedFiles.length, '개 파일');
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        
        console.log(`📤 파일 ${i + 1}/${selectedFiles.length} 처리 중:`, file.name);
        updateProgress(progress);
        
        try {
          // 1단계: S3 업로드
          const uploadResult = await uploadToS3(file);
          console.log('✅ S3 업로드 성공:', uploadResult);
          
          // 2단계: 이미지 향상
          const enhanceResult = await enhanceImage(uploadResult.publicUrl, file.name);
          console.log('✅ 이미지 향상 성공:', enhanceResult);
          
          results.push({
            originalFile: file,
            originalUrl: uploadResult.publicUrl,
            enhancedUrl: enhanceResult.enhancedUrl,
            success: true,
            error: null
          });
          
        } catch (error) {
          console.error(`❌ 파일 ${file.name} 처리 실패:`, error);
          results.push({
            originalFile: file,
            originalUrl: null,
            enhancedUrl: null,
            success: false,
            error: error.message
          });
        }
      }
      
      showResults(results);
      
    } catch (error) {
      console.error('💥 전체 처리 실패:', error);
      showError('이미지 보정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      isProcessing = false;
      updateEnhanceButton();
      hideProgressBar();
    }
  }

  // S3 업로드 함수 (직접 업로드 방식)
  async function uploadToS3(file) {
    try {
      console.log('📤 S3 업로드 시작:', file.name, file.size, file.type);
      
      // 파일 검증
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(`파일 검증 실패: ${validation.errors.join(', ')}`);
      }
      
      // 안전한 파일명 사용
      const safeFilename = validation.sanitizedName;
      console.log('🔍 파일명 정리:', file.name, '→', safeFilename);
      
      console.log('🔍 파일 검증 통과, 직접 업로드 API 호출 중...');
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // 직접 업로드 API 호출
      const response = await fetch('/api/upload-direct', {
        method: 'POST',
        body: formData
      });

      console.log('📡 직접 업로드 API 응답:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 직접 업로드 API 오류:', errorData);
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ 직접 업로드 성공:', data);
      
      return {
        key: data.key,
        publicUrl: data.publicUrl,
        message: data.message
      };
      
    } catch (error) {
      console.error('💥 S3 업로드 오류:', error);
      throw error;
    }
  }

  // 이미지 향상
  async function enhanceImage(imageUrl, filename) {
    try {
      console.log('🔧 이미지 향상 시작:', filename, imageUrl);
      
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          filename
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image enhancement failed');
      }

      const result = await response.json();
      console.log('✅ 이미지 향상 완료:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ 이미지 향상 실패:', error);
      throw error;
    }
  }

  // 결과 표시
  function showResults(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    let html = `
      <div class="results-header">
        <h3>처리 결과</h3>
        <div class="results-summary">
          <span class="success-count">✅ 성공: ${successCount}개</span>
          <span class="fail-count">❌ 실패: ${failCount}개</span>
        </div>
      </div>
    `;
    
    results.forEach((result, index) => {
      if (result.success) {
        html += `
          <div class="result-item success">
            <div class="result-header">
              <span class="file-name">${result.originalFile.name}</span>
              <span class="status">✅ 성공</span>
            </div>
            <div class="result-content">
              <div class="image-comparison">
                <div class="image-wrapper">
                  <h4>원본</h4>
                  <img src="${result.originalUrl}" alt="원본" onerror="this.parentElement.innerHTML='<div class=\'image-error\'>이미지를 불러올 수 없습니다</div>'">
                  <a href="${result.originalUrl}" target="_blank" class="image-link">🔗 원본 보기</a>
                </div>
                <div class="image-wrapper">
                  <h4>향상된 이미지</h4>
                  <img src="${result.enhancedUrl}" alt="향상된 이미지" onerror="this.parentElement.innerHTML='<div class=\'image-error\'>이미지를 불러올 수 없습니다</div>'">
                  <a href="${result.enhancedUrl}" target="_blank" class="image-link">🔗 향상된 이미지 보기</a>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="result-item error">
            <div class="result-header">
              <span class="file-name">${result.originalFile.name}</span>
              <span class="status">❌ 실패</span>
            </div>
            <div class="result-content">
              <div class="error-message">
                <strong>오류:</strong> ${result.error}
              </div>
            </div>
          </div>
        `;
      }
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
  }

  // 오류 표시
  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="result-item error">
        <div class="result-content">
          <div class="error-message">
            <strong>오류:</strong> ${message}
          </div>
        </div>
      </div>
    `;
    resultsContainer.style.display = 'block';
  }

  // 결과 초기화
  function clearResults() {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
  }

  // API 테스트 함수들
  async function testSimpleAPI() {
    try {
      const response = await fetch('/api/test-simple');
      const data = await response.json();
      showAPITestResult('간단 API 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('간단 API 테스트', 0, { error: error.message });
    }
  }

  async function testAPI() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      showAPITestResult('API 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('API 테스트', 0, { error: error.message });
    }
  }

  async function testS3() {
    try {
      const response = await fetch('/api/test-s3');
      const data = await response.json();
      showAPITestResult('S3 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('S3 테스트', 0, { error: error.message });
    }
  }

  async function checkEnvironment() {
    try {
      const response = await fetch('/api/whoami');
      const data = await response.json();
      showAPITestResult('환경변수 확인', response.status, data);
    } catch (error) {
      showAPITestResult('환경변수 확인', 0, { error: error.message });
    }
  }

  async function testImageUrl() {
    try {
      // 간단한 테스트 파일 생성
      const testFile = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', testFile);
      
      const response = await fetch('/api/upload-direct', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      showAPITestResult('이미지 URL 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('이미지 URL 테스트', 0, { error: error.message });
    }
  }

  async function testSimpleUpload() {
    try {
      const response = await fetch('/api/test-s3');
      const data = await response.json();
      showAPITestResult('간단 업로드 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('간단 업로드 테스트', 0, { error: error.message });
    }
  }

  async function testRealFile() {
    try {
      if (selectedFiles.length === 0) {
        showAPITestResult('실제 파일 테스트', 0, { error: '파일을 먼저 선택하세요' });
        return;
      }
      
      const file = selectedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-direct', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      showAPITestResult('실제 파일 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('실제 파일 테스트', 0, { error: error.message });
    }
  }

  async function checkAPIStatus() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      showAPITestResult('API 상태 확인', response.status, data);
    } catch (error) {
      showAPITestResult('API 상태 확인', 0, { error: error.message });
    }
  }

  async function testS3Cors() {
    try {
      // S3 CORS 테스트를 위한 간단한 요청
      const response = await fetch('/api/test-s3');
      const data = await response.json();
      showAPITestResult('S3 CORS 테스트', response.status, data);
    } catch (error) {
      showAPITestResult('S3 CORS 테스트', 0, { error: error.message });
    }
  }

  function showAPITestResult(title, status, data) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'api-result';
    resultDiv.innerHTML = `
      <h4>${title}</h4>
      <p><strong>상태:</strong> ${status} ${status === 200 ? '✅' : '❌'}</p>
      <p><strong>응답:</strong> ${JSON.stringify(data, null, 2)}</p>
    `;
    
    // 기존 결과 제거
    const existingResults = document.querySelectorAll('.api-result');
    existingResults.forEach(r => r.remove());
    
    // 새 결과 추가
    document.body.appendChild(resultDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      resultDiv.remove();
    }, 5000);
  }

  console.log('🎉 Aqua.AI 앱 로딩 완료!');
});
