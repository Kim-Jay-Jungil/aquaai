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

  // 파일명 정리 함수
  function sanitizeFilename(filename) {
    // 특수문자 제거 및 안전한 파일명으로 변환
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // 특수문자를 언더스코어로 변환
      .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_+|_+$/g, ''); // 앞뒤 언더스코어 제거
  }

  // 파일 검증 함수
  function validateFile(file) {
    const errors = [];
    
    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`파일 크기가 10MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    // 파일 타입 검증 (이미지 파일 + WebP 지원)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/heic'
    ];
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      errors.push(`지원하지 않는 파일 타입입니다. (현재: ${file.type})\n지원 형식: JPG, PNG, GIF, WebP, BMP, TIFF, HEIC`);
    }
    
    // 파일명 검증
    if (file.name.length > 100) {
      errors.push(`파일명이 너무 깁니다. (현재: ${file.name.length}자)`);
    }
    
    // 파일명 특수문자 검증
    if (/[<>:"/\\|?*]/.test(file.name)) {
      errors.push(`파일명에 사용할 수 없는 문자가 포함되어 있습니다.`);
    }
    
    // 파일 확장자 검증
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`지원하지 않는 파일 확장자입니다. (현재: .${extension})\n지원 확장자: ${allowedExtensions.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      sanitizedName: sanitizeFilename(file.name),
      fileType: file.type,
      extension: extension
    };
  }

  // 파일 선택 처리
  function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // 파일 검증
      const validFiles = [];
      const invalidFiles = [];
      
      files.forEach(file => {
        const validation = validateFile(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
          console.warn(`⚠️ 파일 검증 실패: ${file.name}`, validation.errors);
        }
      });
      
      if (invalidFiles.length > 0) {
        const errorMessage = `다음 파일들은 업로드할 수 없습니다:\n\n${invalidFiles.map(f => `• ${f.name}: ${validateFile(f).errors.join(', ')}`).join('\n')}`;
        alert(errorMessage);
      }
      
      if (validFiles.length > 0) {
        selectedFiles = validFiles;
        updateUploadArea();
        updateEnhanceButton();
      }
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

  // 이미지 보정 시작
  async function startEnhancement() {
    if (isProcessing || selectedFiles.length === 0) return;
    
    console.log('🚀 이미지 보정 시작');
    console.log('📁 선택된 파일들:', selectedFiles);
    
    isProcessing = true;
    $enhanceBtn.disabled = true;
    $enhanceBtn.textContent = '처리 중...';
    
    try {
      showProgressBar();
      hideResults();
      
      const results = [];
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        console.log(`📤 파일 ${i + 1}/${totalFiles} 업로드 시작:`, file.name);
        
        try {
          // 진행률 업데이트
          const progress = ((i + 1) / totalFiles) * 100;
          updateProgress(progress);
          
          // S3에 업로드
          console.log('🔗 S3 업로드 시작...');
          const uploadResult = await uploadToS3(file);
          console.log('✅ S3 업로드 성공:', uploadResult);
          
          // 이미지 보정
          console.log('🎨 이미지 보정 시작...');
          const enhanceResult = await enhanceImage(
            uploadResult.publicUrl || uploadResult.url, 
            file.name, 
            $userEmail.value
          );
          console.log('✅ 이미지 보정 성공:', enhanceResult);
          
          results.push({
            filename: file.name,
            originalUrl: uploadResult.publicUrl || uploadResult.url,
            enhancedUrl: enhanceResult.enhancedUrl,
            processingTime: enhanceResult.processingTime,
            notionLogged: enhanceResult.notionLogged
          });
          
        } catch (fileError) {
          console.error(`❌ 파일 ${file.name} 처리 실패:`, fileError);
          console.error(`❌ 오류 상세:`, {
            message: fileError.message,
            stack: fileError.stack,
            name: fileError.name
          });
          
          // 개별 파일 실패해도 계속 진행
          results.push({
            filename: file.name,
            error: fileError.message,
            errorDetails: {
              name: fileError.name,
              stack: fileError.stack
            }
          });
        }
      }
      
      console.log('🎯 모든 파일 처리 완료:', results);
      showResults(results);
      
    } catch (error) {
      console.error('💥 전체 처리 실패:', error);
      alert(`이미지 보정 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      isProcessing = false;
      $enhanceBtn.disabled = false;
      $enhanceBtn.textContent = '이미지 보정 시작';
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
      }
      
      throw new Error(userMessage);
    }
  }

  // 이미지 보정 API 호출 (Notion DB 저장 포함)
  async function enhanceImage(imageUrl, filename, email) {
    try {
      console.log('🎨 이미지 보정 시작:', filename);
      console.log('🔗 이미지 URL:', imageUrl);
      console.log('📧 사용자 이메일:', email);
      console.log('⚙️ 보정 강도:', selectedEnhancementLevel);
      
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

      console.log('📡 보정 API 응답:', response.status, response.statusText);

      const data = await response.json();
      console.log('✅ 보정 API 응답 데이터:', data);
      
      if (!response.ok) {
        console.error('❌ 보정 API 오류:', data);
        throw new Error(data.error || data.detail || 'Enhancement failed');
      }

      console.log('🎯 이미지 보정 완료:', data);
      return data;
      
    } catch (error) {
      console.error('💥 이미지 보정 오류:', error);
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
    console.log('🎯 결과 표시 시작:', results);
    
    $resultsGrid.innerHTML = results.map((result, index) => {
      console.log(`📸 결과 ${index + 1}:`, result);
      
      if (result.error) {
        // 오류가 있는 경우
        return `
          <div class="result-item error">
            <div class="error-info">
              <h4>❌ ${result.filename} - 처리 실패</h4>
              <p class="error-message">${result.error}</p>
            </div>
          </div>
        `;
      }
      
      // 성공한 경우
      const originalUrl = result.originalUrl;
      const enhancedUrl = result.enhancedUrl;
      
      console.log(`🖼️ 원본 이미지 URL:`, originalUrl);
      console.log(`🎨 보정된 이미지 URL:`, enhancedUrl);
      
      return `
        <div class="result-item">
          <div class="image-comparison">
            <div class="image-container">
              <h4>원본</h4>
              <div class="image-wrapper">
                <img src="${originalUrl}" alt="원본 이미지" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="image-error" style="display: none; padding: 20px; text-align: center; color: #666;">
                  <p>❌ 이미지를 불러올 수 없습니다</p>
                  <p class="image-url">${originalUrl}</p>
                </div>
              </div>
              <p class="filename">${result.filename}</p>
            </div>
            <div class="image-container">
              <h4>보정된 이미지</h4>
              <div class="image-wrapper">
                <img src="${enhancedUrl}" alt="보정된 이미지" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="image-error" style="display: none; padding: 20px; text-align: center; color: #666;">
                  <p>❌ 이미지를 불러올 수 없습니다</p>
                  <p class="image-url">${enhancedUrl}</p>
                </div>
              </div>
              <p class="filename">${result.filename}_enhanced</p>
            </div>
          </div>
          <div class="result-info">
            <p><strong>처리 시간:</strong> ${result.processingTime || 'N/A'}ms</p>
            <p><strong>Notion 저장:</strong> ${result.notionLogged ? '✅ 성공' : '❌ 실패'}</p>
            <p><strong>원본 URL:</strong> <a href="${originalUrl}" target="_blank">${originalUrl}</a></p>
            <p><strong>보정 URL:</strong> <a href="${enhancedUrl}" target="_blank">${enhancedUrl}</a></p>
          </div>
          <div class="result-actions">
            <button class="btn btn-small" onclick="downloadImage('${enhancedUrl}', '${result.filename}_enhanced')">
              다운로드
            </button>
          </div>
        </div>
      `;
    }).join('');

    $resultsSection.classList.remove('hidden');
    console.log('✅ 결과 표시 완료');
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
      showApiResult(`