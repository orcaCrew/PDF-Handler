
## 기능

- PDF 파일 업로드
- PDF 페이지별 미리보기
- 페이지 네비게이션 (이전/다음)
- 선택한 범위의 PDF 페이지 저장

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm start
```

3. 브라우저에서 `http://localhost:3400`으로 접속

## 사용된 기술

- React 18
- JavaScript
- Tailwind CSS
- react-pdf (PDF 렌더링)

## 프로젝트 구조

```
PDFhandler/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # 메인 컴포넌트
│   ├── index.js        # 앱 진입점
│   └── index.css       # 스타일시트
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
``` 