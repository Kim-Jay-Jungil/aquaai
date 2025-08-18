// app.js - 메인 웹사이트 JavaScript (이미지 업로드 → 보정 → Notion 저장)
(function () {
  // DOM 요소들
  const $fileInput = document.getElementById('fileInput');
  const $uploadArea = document.getElementById('uploadArea');
  const $enhanceBtn = document.getElementById('enhanceBtn');
  const $progressBar = document.getElementById('progressBar');
  const $resultsSection = document.getElementById('resultsSection');
  const $resultsGrid = document.getElementById('resultsGrid');
  const $optionButtons = document.querySelectorAll('.option-btn');
  const $userEmail = document.getElementById('userEmail');
  
  // API 테스트 관련 요소들
  const $simpleApiBtn = document.getElementById('simpleApiBtn');
  const $apiTestBtn = document.getElementById('apiTestBtn');
  const $s3TestBtn = document.getElementById('s3TestBtn');
  const $envCheckBtn = document.getElementById('envCheckBtn');
  const $apiTestResult = document.getElementById('apiTestResult');
  
  // 상태 변수들
  let selectedFiles = [];
  let selectedEnhancementLevel = 'auto';
  let isProcessing = false;

  // 이벤트 리스너 등록
  $fileInput.addEventListener('change', handleFileSelect);
  $uploadArea.addEventListener('click', () => $fileInput.click());
  $uploadArea.addEventListener('dragover', handleDragOver);
  $uploadArea.addEventListener('drop', handleDrop);
  $enhanceBtn.addEventListener('click', startEnhancement);
  
  // API 테스트 버튼 이벤트 리스너
  if ($simpleApiBtn) $simpleApiBtn.addEventListener('click', testSimpleAPI);
  if ($apiTestBtn) $apiTestBtn.addEventListener('click', testAPI);
  if ($s3TestBtn) $s3TestBtn.addEventListener('click', testPresign);
  if ($envCheckBtn) $envCheckBtn.addEventListener('click', checkEnvironment);
  
  // 보정 강도 선택 버튼 이벤트
  $optionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      $optionButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedEnhancementLevel = btn.dataset.level;
    });
  });

  // 파일 선택 처리
  function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      selectedFiles = files;
      updateUploadArea();
      updateEnhanceButton();
    }
  }

  // 드래그 앤 드롭 처리
  function handleDragOver(event) {
    event.preventDefault();
    $uploadArea.classList.add('drag-over');
  }

  function handleDrop(event) {
    event.preventDefault();
    $uploadArea.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      selectedFiles = files;
      updateUploadArea();
      updateEnhanceButton();
    }
  }

  // 업로드 영역 업데이트
  function updateUploadArea() {
    if (selectedFiles.length === 0) {
      $uploadArea.innerHTML = `
        <div class="upload-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <p>클릭하여 이미지를 선택하거나 드래그하여 업로드하세요</p>
          <p class="upload-hint">JPG, PNG, HEIC 지원 (최대 10MB)</p>
        </div>
        <input id="fileInput" type="file" accept="image/*" multiple />
      `;
      
      // 파일 입력 이벤트 리스너 다시 등록
      const newFileInput = $uploadArea.querySelector('#fileInput');
      if (newFileInput) {
        newFileInput.addEventListener('change', handleFileSelect);
      }
    } else {
      $uploadArea.innerHTML = `
        <div class="selected-files">
          <h4>선택된 파일 (${selectedFiles.length}개)</h4>
          <div class="file-preview-grid">
            ${selectedFiles.map((file, index) => `
              <div class="file-preview-item">
                <div class="file-preview-image">
                  <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
                </div>
                <div class="file-info">
                  <span class="file-name">${file.name}</span>
                  <span class="file-size">${formatFileSize(file.size)}</span>
                  <button class="remove-file" onclick="removeFile(${index})">×</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <input id="fileInput" type="file" accept="image/*" multiple />
      `;
      
      // 파일 입력 이벤트 리스너 다시 등록
      const newFileInput = $uploadArea.querySelector('#fileInput');
      if (newFileInput) {
        newFileInput.addEventListener('change', handleFileSelect);
      }
    }
  }

  // 파일 제거
  window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    updateUploadArea();
    updateEnhanceButton();
  };

  // 보정 버튼 상태 업데이트
  function updateEnhanceButton() {
    $enhanceBtn.disabled = selectedFiles.length === 0 || isProcessing;
  }

  // 파일 크기 포맷팅
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 이미지 보정 시작 (전체 플로우)
  async function startEnhancement() {
    if (selectedFiles.length === 0 || isProcessing) return;

    isProcessing = true;
    updateEnhanceButton();
    showProgressBar();
    hideResults();

    try {
      const results = [];
      const userEmail = $userEmail.value.trim() || 'anonymous@example.com';
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // 진행률 업데이트
        updateProgress((i / selectedFiles.length) * 100);
        
        console.log(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name}`);
        
        // 1. S3에 업로드
        const uploadResult = await uploadToS3(file);
        console.log('File uploaded to S3:', uploadResult.publicUrl);
        
        // 2. 이미지 보정 및 Notion DB 저장
        const enhanceResult = await enhanceImage(uploadResult.publicUrl, file.name, userEmail);
        console.log('Image enhancement completed:', enhanceResult);
        
        results.push({
          originalFile: file,
          originalUrl: uploadResult.publicUrl,
          enhancedUrl: enhanceResult.enhancedUrl,
          filename: file.name,
          processingTime: enhanceResult.processingTime,
          notionLogged: enhanceResult.notionLogged
        });
      }

      // 완료
      updateProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // 진행률 바 완료 애니메이션
      
      showResults(results);
      
      // 성공 메시지
      alert(`🎉 ${selectedFiles.length}개 이미지 보정이 완료되었습니다!\n\n모든 결과가 Notion 데이터베이스에 저장되었습니다.`);
      
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert(`이미지 보정 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      isProcessing = false;
      updateEnhanceButton();
      hideProgressBar();
    }
  }

  // S3 업로드 함수
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
      
      console.log('🔍 파일 검증 통과, presign API 호출 중...');
      
      // Presign API 호출
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: safeFilename, 
          contentType: file.type 
        })
      });

      console.log('📡 Presign API 응답:', response.status, response.statusText);

      // 응답 타입 확인
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Non-JSON 응답:', responseText);
        throw new Error('서버에서 JSON 응답을 반환하지 않았습니다. API 엔드포인트를 확인하세요.');
      }

      const data = await response.json();
      console.log('✅ Presign API 응답 데이터:', data);
      
      if (!response.ok) {
        console.error('❌ Presign API 오류:', data);
        throw new Error(data.message || data.error || data.detail || 'Upload failed');
      }

      if (!data.url) {
        console.error('❌ Presign 응답에 URL 누락:', data);
        throw new Error('Invalid presign response: missing upload URL');
      }

      console.log('🔗 Presigned URL 받음, S3에 직접 업로드 중...');

      // S3에 직접 업로드
      console.log('🔗 S3 업로드 시작...');
      
      // Content-Type 헤더 최적화
      let optimizedContentType = file.type;
      if (file.type === 'image/webp') {
        optimizedContentType = 'image/webp';
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        optimizedContentType = 'image/jpeg';
      } else if (file.type === 'image/png') {
        optimizedContentType = 'image/png';
      }
      
      console.log('📋 업로드 정보:', {
        url: data.url,
        method: 'PUT',
        originalContentType: file.type,
        optimizedContentType: optimizedContentType,
        fileSize: file.size,
        fileName: file.name,
        sanitizedName: safeFilename
      });
      
      const uploadResponse = await fetch(data.url, {
        method: 'PUT',
        headers: { 
          'content-type': optimizedContentType,
          'x-amz-acl': 'public-read' // 공개 읽기 권한 추가
        },
        body: file
      });

      console.log('📤 S3 업로드 응답:', uploadResponse.status, uploadResponse.statusText);
      console.log('📋 S3 응답 헤더:', Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ S3 업로드 실패:', errorText);
        console.error('❌ S3 응답 상태:', uploadResponse.status, uploadResponse.statusText);
        console.error('❌ S3 응답 헤더:', Object.fromEntries(uploadResponse.headers.entries()));
        
        // 특정 오류 코드별 상세 메시지
        let detailedError = `S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
        
        if (uploadResponse.status === 403) {
          detailedError = 'S3 접근 권한 오류: AWS 설정을 확인하세요.';
        } else if (uploadResponse.status === 400) {
          detailedError = 'S3 요청 오류: 파일 형식이나 크기를 확인하세요.';
        } else if (uploadResponse.status === 500) {
          detailedError = 'S3 서버 오류: 잠시 후 다시 시도하세요.';
        } else if (uploadResponse.status === 0) {
          detailedError = '네트워크 오류: 인터넷 연결을 확인하세요.';
        }
        
        throw new Error(detailedError);
      }

      console.log('✅ S3 업로드 성공');
      console.log('📋 최종 결과:', data);
      return data;
      
    } catch (error) {
      console.error('💥 S3 업로드 오류:', error);
      
      // 사용자 친화적인 에러 메시지
      let userMessage = '파일 업로드에 실패했습니다.';
      
      if (error.message.includes('JSON 응답을 반환하지 않았습니다')) {
        userMessage = '서버 설정 오류: API 엔드포인트가 올바르게 작동하지 않습니다.';
      } else if (error.message.includes('환경 변수가 설정되지 않았습니다')) {
        userMessage = '서버 설정 오류: S3 환경 변수가 설정되지 않았습니다.';
      } else if (error.message.includes('S3 접근 권한 오류')) {
        userMessage = 'AWS 설정 오류: S3 접근 권한을 확인하세요.';
      } else if (error.message.includes('network')) {
        userMessage = '네트워크 오류: 인터넷 연결을 확인하세요.';
      } else if (error.message.includes('파일 크기가 10MB를 초과합니다')) {
        userMessage = '파일 크기 오류: 10MB 이하의 파일만 업로드 가능합니다.';
      } else if (error.message.includes('이미지 파일만 업로드 가능합니다')) {
        userMessage = '파일 타입 오류: 이미지 파일만 업로드 가능합니다.';
      } else if (error.message.includes('파일 검증 실패')) {
        userMessage = error.message;
      } else if (error.message.includes('S3 접근 권한 오류')) {
        userMessage = 'AWS S3 접근 권한 오류: AWS 설정을 확인하세요.';
      } else if (error.message.includes('S3 요청 오류')) {
        userMessage = 'S3 요청 오류: 파일 형식이나 크기를 확인하세요.';
      } else if (error.message.includes('S3 서버 오류')) {
        userMessage = 'S3 서버 오류: 잠시 후 다시 시도하세요.';
      } else if (error.message.includes('네트워크 오류')) {
        userMessage = '네트워크 오류: 인터넷 연결을 확인하세요.';
      } else {
        // 원본 오류 메시지를 포함
        userMessage = `파일 업로드 실패: ${error.message}`;
      }
      
      throw new Error(userMessage);
    }
  }

  // 이미지 보정 API 호출 (Notion DB 저장 포함)
  async function enhanceImage(imageUrl, filename, email) {
    try {
      console.log('Starting image enhancement for:', filename);
      
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          filename,
          email,
          enhancementLevel: selectedEnhancementLevel
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Enhancement API error:', data);
        throw new Error(data.error || data.detail || 'Enhancement failed');
      }

      console.log('Image enhancement API response:', data);
      return data;
      
    } catch (error) {
      console.error('Image enhancement error:', error);
      throw new Error(`이미지 보정 실패: ${error.message}`);
    }
  }

  // 진행률 표시
  function showProgressBar() {
    $progressBar.classList.remove('hidden');
    updateProgress(0);
  }

  function hideProgressBar() {
    $progressBar.classList.add('hidden');
  }

  function updateProgress(percent) {
    const progressFill = $progressBar.querySelector('.progress-fill');
    progressFill.style.width = `${percent}%`;
  }

  // 결과 표시
  function showResults(results) {
    $resultsGrid.innerHTML = results.map(result => `
      <div class="result-item">
        <div class="image-comparison">
          <div class="image-container">
            <h4>원본</h4>
            <img src="${result.originalUrl}" alt="원본 이미지" />
            <p class="filename">${result.filename}</p>
          </div>
          <div class="image-container">
            <h4>보정된 이미지</h4>
            <img src="${result.enhancedUrl}" alt="보정된 이미지" />
            <p class="filename">${result.filename}_enhanced</p>
          </div>
        </div>
        <div class="result-info">
          <p><strong>처리 시간:</strong> ${result.processingTime}ms</p>
          <p><strong>Notion 저장:</strong> ${result.notionLogged ? '✅ 성공' : '❌ 실패'}</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-small" onclick="downloadImage('${result.enhancedUrl}', '${result.filename}_enhanced')">
            다운로드
          </button>
        </div>
      </div>
    `).join('');

    $resultsSection.classList.remove('hidden');
  }

  function hideResults() {
    $resultsSection.classList.add('hidden');
  }

  // 이미지 다운로드
  window.downloadImage = function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 전체 다운로드
  document.getElementById('downloadAllBtn')?.addEventListener('click', () => {
    const downloadButtons = $resultsGrid.querySelectorAll('.btn-small');
    downloadButtons.forEach(btn => btn.click());
  });

  // 공유하기
  document.getElementById('shareBtn')?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aqua.AI로 보정한 수중 사진',
          text: '수중 사진을 AI로 자동 보정했습니다!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드에 복사
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  });

  // API 테스트 함수들
  async function testSimpleAPI() {
    showApiResult('간단 API 테스트 중...', 'info');
    
    try {
      const response = await fetch('/api/test-simple');
      const data = await response.json();
      
      if (response.ok) {
        showApiResult(`✅ 간단 API 테스트 성공!\n\n${JSON.stringify(data, null, 2)}`, 'success');
      } else {
        showApiResult(`❌ API 테스트 실패\n상태: ${response.status}\n${JSON.stringify(data, null, 2)}`, 'error');
      }
    } catch (error) {
      showApiResult(`❌ 네트워크 오류\n${error.message}`, 'error');
    }
  }

  async function testAPI() {
    showApiResult('API 테스트 중...', 'info');
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        showApiResult(`✅ API 테스트 성공!\n\n상태: ${data.status}\n메시지: ${data.message}\n시간: ${data.timestamp}\n환경: ${data.environment}`, 'success');
      } else {
        showApiResult(`❌ API 테스트 실패\n상태: ${response.status}\n${JSON.stringify(data, null, 2)}`, 'error');
      }
    } catch (error) {
      showApiResult(`❌ 네트워크 오류\n${error.message}`, 'error');
    }
  }

  async function testPresign() {
    showApiResult('S3 Presign API 테스트 중...', 'info');
    
    try {
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        showApiResult(`✅ S3 Presign API 성공!\n\nURL: ${data.url ? '생성됨' : '누락'}\nKey: ${data.key || 'N/A'}\nPublic URL: ${data.publicUrl || 'N/A'}`, 'success');
      } else {
        showApiResult(`❌ S3 Presign API 실패\n상태: ${response.status}\n오류: ${data.error || 'Unknown'}`, 'error');
      }
    } catch (error) {
      showApiResult(`❌ 네트워크 오류\n${error.message}`, 'error');
    }
  }

  async function checkEnvironment() {
    showApiResult('환경 변수 확인 중...', 'info');
    
    try {
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      
      if (data.success) {
        const envInfo = Object.entries(data.environment).map(([key, value]) => `${key}: ${value}`).join('\n');
        showApiResult(`✅ 환경 변수 확인 성공!\n\n${envInfo}\n\nAWS SDK: ${data.awsTest}`, 'success');
      } else {
        showApiResult(`❌ 환경 변수 확인 실패\n${data.error}`, 'error');
      }
    } catch (error) {
      showApiResult(`❌ 네트워크 오류\n${error.message}`, 'error');
    }
  }

  function showApiResult(message, type) {
    $apiTestResult.style.display = 'block';
    $apiTestResult.textContent = message;
    $apiTestResult.className = `api-result ${type}`;
  }

})();
