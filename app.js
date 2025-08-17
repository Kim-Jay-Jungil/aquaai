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
    } else {
      $uploadArea.innerHTML = `
        <div class="selected-files">
          <h4>선택된 파일 (${selectedFiles.length}개)</h4>
          <div class="file-list">
            ${selectedFiles.map((file, index) => `
              <div class="file-item">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button class="remove-file" onclick="removeFile(${index})">×</button>
              </div>
            `).join('')}
          </div>
        </div>
        <input id="fileInput" type="file" accept="image/*" multiple />
      `;
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

  // S3 업로드
  async function uploadToS3(file) {
    try {
      console.log('Starting S3 upload for file:', file.name);
      
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type 
        })
      });

      // 응답 타입 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', contentType);
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text());
        throw new Error('서버에서 JSON 응답을 반환하지 않았습니다. API 엔드포인트를 확인하세요.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Presign API error:', data);
        throw new Error(data.message || data.error || data.detail || 'Upload failed');
      }

      if (!data.url) {
        throw new Error('Invalid presign response: missing upload URL');
      }

      console.log('Presigned URL received, uploading to S3...');

      // S3에 직접 업로드
      const uploadResponse = await fetch(data.url, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('File uploaded to S3 successfully');
      return data;
      
    } catch (error) {
      console.error('S3 upload error:', error);
      
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

  // API 테스트 함수들 (전역으로 노출)
  window.testAPI = async function() {
    const resultDiv = document.getElementById('apiTestResult');
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#fff3cd';
    resultDiv.style.color = '#856404';
    resultDiv.textContent = '헬스체크 API 테스트 중...';

    try {
      const response = await fetch('/api/health');
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ Non-JSON 응답\n상태: ${response.status}\nContent-Type: ${contentType}\n응답: ${await response.text()}`;
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        resultDiv.style.background = '#d4edda';
        resultDiv.style.color = '#155724';
        resultDiv.textContent = `✅ 헬스체크 성공!\n\n상태: ${data.status}\n메시지: ${data.message}\n시간: ${data.timestamp}\n환경: ${data.environment}`;
      } else {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ 헬스체크 실패\n상태: ${response.status}\n오류: ${JSON.stringify(data, null, 2)}`;
      }
    } catch (error) {
      resultDiv.style.background = '#f8d7da';
      resultDiv.style.color = '#721c24';
      resultDiv.textContent = `❌ 네트워크 오류\n${error.message}`;
    }
  };

  window.testPresign = async function() {
    const resultDiv = document.getElementById('apiTestResult');
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#fff3cd';
    resultDiv.style.color = '#856404';
    resultDiv.textContent = 'Presign API 테스트 중...';

    try {
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        })
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ Non-JSON 응답\n상태: ${response.status}\nContent-Type: ${contentType}\n응답: ${await response.text()}`;
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.ok) {
        resultDiv.style.background = '#d4edda';
        resultDiv.style.color = '#155724';
        resultDiv.textContent = `✅ Presign API 성공!\n\nURL: ${data.url ? '생성됨' : '누락'}\nKey: ${data.key || 'N/A'}\nPublic URL: ${data.publicUrl || 'N/A'}\n메시지: ${data.message || 'N/A'}`;
      } else {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ Presign API 실패\n상태: ${response.status}\n오류: ${data.error || 'Unknown'}\n상세: ${data.detail || 'N/A'}\n메시지: ${data.message || 'N/A'}`;
      }
    } catch (error) {
      resultDiv.style.background = '#f8d7da';
      resultDiv.style.color = '#721c24';
      resultDiv.textContent = `❌ 네트워크 오류\n${error.message}`;
    }
  };

  window.checkEnvironment = async function() {
    const resultDiv = document.getElementById('apiTestResult');
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#fff3cd';
    resultDiv.style.color = '#856404';
    resultDiv.textContent = '환경 변수 확인 중...';

    try {
      const response = await fetch('/api/debug-env');
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ Non-JSON 응답\n상태: ${response.status}\nContent-Type: ${contentType}\n응답: ${await response.text()}`;
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        resultDiv.style.background = '#d4edda';
        resultDiv.style.color = '#155724';
        resultDiv.textContent = `✅ 환경 변수 확인 성공!\n\n${Object.entries(data.environment).map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nAWS SDK: ${data.awsTest}`;
      } else {
        resultDiv.style.background = '#f8d7da';
        resultDiv.style.color = '#721c24';
        resultDiv.textContent = `❌ 환경 변수 확인 실패\n${data.error}`;
      }
    } catch (error) {
      resultDiv.style.background = '#f8d7da';
      resultDiv.style.color = '#721c24';
      resultDiv.textContent = `❌ 네트워크 오류\n${error.message}`;
    }
  };

})();
