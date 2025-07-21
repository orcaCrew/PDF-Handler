import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const onFileChange = (event) => {
    const { files } = event.target;
    if (files && files[0]) {
      setFile(files[0]);
      setPageNumber(1);
    }
    // 파일 선택 후 input 값을 초기화하여 같은 파일을 다시 선택할 수 있도록 함
    event.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setPageNumber(1);
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF 로드 오류:', error);
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* 제목 영역 */}
        {/* <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            PDF 미리보기
          </h1>
        </div> */}
        
        {/* 선택 영역과 미리보기 영역을 2:8 비율로 배치 */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* PDF 선택 버튼 영역 (20%) */}
          <div className="lg:w-1/5">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md"
                >
                  {file ? 'PDF 파일 변경' : 'PDF 파일 선택'}
                </button>
              </div>
              
              {/* 숨겨진 파일 input - 항상 존재 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
            </div>
          </div>

          {/* PDF 미리보기 영역 (80%) */}
          <div className="lg:w-4/5">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {file ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {file.name}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        disabled={pageNumber <= 1}
                        onClick={previousPage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        이전
                      </button>
                      <span className="text-gray-600">
                        페이지 {pageNumber} / {numPages || '...'}
                      </span>
                      <button
                        type="button"
                        disabled={pageNumber >= numPages}
                        onClick={nextPage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        다음
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="border border-gray-300 rounded-lg shadow-lg bg-white">
                      {loading && (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-gray-600">PDF 로딩 중...</span>
                        </div>
                      )}
                      <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        onLoadStart={() => setLoading(true)}
                        loading={
                          <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-gray-600">PDF 로딩 중...</span>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={pageNumber}
                          width={Math.min(window.innerWidth * 0.8 - 100, 800)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors h-full flex items-center justify-center ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-lg font-medium text-gray-600">
                      PDF 파일을 선택하거나 여기에 드래그하세요
                    </span>
                    <span className="text-sm text-gray-500 mt-2">
                      최대 파일 크기: 10MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}

export default App; 