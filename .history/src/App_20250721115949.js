import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
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
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [extracting, setExtracting] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(600);
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

  // 페이지 수가 변경될 때 endPage 업데이트
  useEffect(() => {
    if (numPages) {
      setEndPage(numPages);
    }
  }, [numPages]);

  // 화면 크기 변경 감지
  useEffect(() => {
    const updateWidth = () => {
      const width = Math.min(window.innerWidth * 0.5, 800);
      setPreviewWidth(width);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onFileChange = (event) => {
    const { files } = event.target;
    if (files && files[0]) {
      setFile(files[0]);
      setPageNumber(1);
      setLoadedPages(new Set());
      setDisplayedPages(3);
      setStartPage(1);
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
        setStartPage(1);
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

  const extractPages = async () => {
    if (!file || !numPages) {
      alert('PDF 파일을 먼저 업로드해주세요.');
      return;
    }

    if (startPage < 1 || endPage > numPages || startPage > endPage) {
      alert('올바른 페이지 범위를 입력해주세요.');
      return;
    }

    setExtracting(true);

    try {
      // PDF 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      
      // PDF 문서 로드
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // 새 PDF 문서 생성
      const newPdfDoc = await PDFDocument.create();
      
      // 선택된 페이지들을 새 문서에 복사
      for (let i = startPage - 1; i < endPage; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
      
      // 새 PDF를 바이트 배열로 변환
      const pdfBytes = await newPdfDoc.save();
      
      // 파일 다운로드
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_pages_${startPage}-${endPage}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`${startPage}페이지부터 ${endPage}페이지까지 추출이 완료되었습니다.`);
    } catch (error) {
      console.error('PDF 추출 오류:', error);
      alert('PDF 추출 중 오류가 발생했습니다.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 페이지 리스트와 미리보기 영역 */}
          <div className="lg:w-5/6">
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 페이지 리스트 영역 */}
                    <div className="space-y-4 max-h-[50rem] overflow-y-auto lg:col-span-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">페이지 목록</h3>
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

                    {/* 선택된 페이지 미리보기 영역 */}
                    <div className="space-y-4 lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800">선택된 페이지</h3>
                      {pageNumber ? (
                        <div className="flex justify-center">
                          <div className="border border-gray-300 rounded-lg shadow-lg bg-white w-full p-4">
                            <div className="w-full flex justify-center">
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
                                  width={window.innerWidth * 0.5}
                                  renderTextLayer={false}
                                  renderAnnotationLayer={false}
                                />
                              </Document>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>페이지를 선택하면 여기서 미리보기를 확인할 수 있습니다.</p>
                        </div>
                      )}
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

          {/* 선택 버튼 영역 */}
          <div className="lg:w-1/6">
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
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

              {/* 페이지 추출 영역 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  페이지 추출
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 페이지
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={numPages || 1}
                      value={startPage}
                      onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 페이지
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={numPages || 1}
                      value={endPage}
                      onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {numPages ? `총 ${numPages}페이지 중 선택` : 'PDF 파일을 업로드해주세요'}
                  </div>
                </div>
                
                <button
                  onClick={extractPages}
                  disabled={extracting || !file || !numPages || startPage > endPage || startPage < 1 || endPage > (numPages || 1)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    extracting || !file || !numPages || startPage > endPage || startPage < 1 || endPage > (numPages || 1)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                  }`}
                >
                  {extracting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      추출 중...
                    </div>
                  ) : (
                    '새 PDF로 저장'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
