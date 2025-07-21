import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [displayedPages, setDisplayedPages] = useState(3); // lazy 로드 시작 수
  const fileInputRef = useRef(null);
  const loaderRef = useRef(null); // 스크롤 lazy 트리거용

  // Intersection Observer로 lazy loading 구현
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && numPages && displayedPages < numPages) {
          setDisplayedPages(prev => Math.min(prev + 3, numPages));
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [displayedPages, numPages]);

  const onFileChange = (event) => {
    const { files } = event.target;
    if (files && files[0]) {
      setFile(files[0]);
      setPageNumber(1);
      setLoadedPages(new Set());
      setDisplayedPages(3);
    }
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
        setLoadedPages(new Set());
        setDisplayedPages(3);
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

  const onPageLoadSuccess = (pageNumber) => {
    setLoadedPages(prev => {
      const newSet = new Set([...prev, pageNumber]);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 미리보기 영역 */}
          <div className="lg:w-4/10">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {file ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {file.name}
                    </h2>
                    <div className="text-gray-600">
                      총 {numPages || '...'} 페이지
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[60rem] overflow-y-auto">
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
                      {numPages &&
                        Array.from(
                          new Array(Math.min(displayedPages, numPages)),
                          (el, index) => (
                            <div
                              key={`page_${index + 1}`}
                              className={`border-2 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer ${
                                pageNumber === index + 1
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200'
                              }`}
                              onClick={() => setPageNumber(index + 1)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <Page
                                    pageNumber={index + 1}
                                    width={120}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onLoadSuccess={() => onPageLoadSuccess(index + 1)}
                                    loading={
                                      <div className="w-30 h-40 bg-gray-200 rounded flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                      </div>
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {index + 1} 페이지 
                                  </h3>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                    </Document>

                    {/* lazy-load 트리거 */}
                    <div ref={loaderRef} className="h-12" />
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

          {/* 선택된 페이지 크게 보기 영역 */}
          <div className="lg:w-4/10">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {file && pageNumber ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      선택된 페이지
                    </h3>
                    <span className="text-sm text-gray-600">
                      {pageNumber} / {numPages}
                    </span>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="border border-gray-300 rounded-lg shadow-lg bg-white">
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
                          width={Math.min(window.innerWidth * 0.4 - 100, 400)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>페이지를 선택하면 여기서 크게 볼 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 선택 버튼 영역 */}
          <div className="lg:w-2/10">
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
        </div>
      </div>
    </div>
  );
}

export default App;
