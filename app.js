// app.js - 메인 웹사이트 JavaScript
(function () {
  // DOM 요소들
  const $fileInput = document.getElementById('fileInput');
  const $uploadArea = document.getElementById('uploadArea');
  const $enhanceBtn = document.getElementById('enhanceBtn');
  const $progressBar = document.getElementById('progressBar');
  const $resultsSection = document.getElementById('resultsSection');
  const $resultsGrid = document.getElementById('resultsGrid');
  const $optionButtons = document.querySelectorAll('.option-btn');
  
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

  // 이미지 보정 시작
  async function startEnhancement() {
    if (selectedFiles.length === 0 || isProcessing) return;

    isProcessing = true;
    updateEnhanceButton();
    showProgressBar();
    hideResults();

    try {
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // 진행률 업데이트
        updateProgress((i / selectedFiles.length) * 100);
        
        // 1. S3에 업로드
        const uploadResult = await uploadToS3(file);
        
        // 2. 이미지 보정
        const enhanceResult = await enhanceImage(uploadResult.publicUrl, file.name);
        
        results.push({
          originalFile: file,
          originalUrl: uploadResult.publicUrl,
          enhancedUrl: enhanceResult.enhancedUrl,
          filename: file.name
        });
      }

      // 완료
      updateProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // 진행률 바 완료 애니메이션
      
      showResults(results);
      
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
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      // S3에 직접 업로드
      await fetch(data.url, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file
      });

      return data;
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  // 이미지 보정 API 호출
  async function enhanceImage(imageUrl, filename) {
    try {
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          filename,
          enhancementLevel: selectedEnhancementLevel
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enhancement failed');

      return data;
    } catch (error) {
      throw new Error(`Image enhancement failed: ${error.message}`);
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

})();
