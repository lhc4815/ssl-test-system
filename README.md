# SSL 적성검사 시스템 v2

웹 기반 적성검사 시스템으로, 사용자가 온라인으로 적성검사를 수행하고 결과를 데이터베이스에 저장하는 서비스입니다.

## 🎯 주요 기능

- **로그인 시스템**: 코드 기반 인증 + 중복 사용 방지
- **3단계 테스트**: Type A(240문항) → B(10문항) → C(10문항) 자동 진행
- **실시간 답안 저장**: 선택 즉시 DB 저장, 중복 방지
- **관리자 기능**: 테스트 점프, 랜덤 답안 생성
- **완료 처리**: 점수 계산, 코드 비활성화

## 🏗️ 기술 스택

- **Frontend**: React.js, React Router, CSS3
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: MySQL (AWS RDS)
- **Testing**: 실제 데이터베이스 연동 테스트

## 📁 프로젝트 구조

```
ssl-test-v2/
├── client/              # React 프론트엔드
│   ├── public/
│   └── src/
│       ├── pages/       # 페이지 컴포넌트
│       ├── App.js
│       └── App.css
├── server/              # Node.js 백엔드
│   ├── src/
│   │   ├── config/      # DB 설정
│   │   └── models/      # Sequelize 모델
│   └── public/
│       └── images/      # Type B/C 문제 이미지
├── db/                  # 데이터베이스 관련
│   └── problem-v1.xlsx  # 문제 데이터
└── README.md
```

## 🚀 설치 및 실행

### 1. 환경 설정

서버 환경변수 파일 생성:
```bash
# server/.env
DB_HOST=your_db_host
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=SSL-survey
PORT=5000
NODE_ENV=development
```

### 2. 의존성 설치

```bash
# 백엔드 의존성 설치
cd server
npm install

# 프론트엔드 의존성 설치
cd ../client
npm install
```

### 3. 서버 실행

```bash
# 백엔드 서버 실행 (포트 5000)
cd server
npm run dev

# 프론트엔드 서버 실행 (포트 3000)
cd client
npm start
```

## 🎮 사용 방법

1. **로그인**: http://localhost:3000 접속
2. **테스트 코드 입력**: TEST0001, TEST0002, TEST0003 등
3. **관리자 모드**: ADM0000 코드로 로그인
4. **테스트 진행**: Type A → B → C 순서로 자동 진행

## 📊 테스트 구조

| 단계 | 문항 수 | 시간 제한 | 특징 |
|------|---------|-----------|------|
| Type A | 240문항 | 10초/문항 | 5점 척도 |
| Type B | 10문항 | 개별 10초, 블록 120초 | 객관식 4지선다 |
| Type C | 10문항 | 개별 240초, 블록 720초 | 이미지 기반 |

## 🔧 개발 특징

- **효율적인 DB 설계**: JSON 배열로 답안 저장 (99.6% 성능 향상)
- **반응형 UI**: 모바일/데스크톱 대응
- **실시간 피드백**: 타이머, 진행률 표시
- **중복 방지**: 연속 클릭, 답안 덮어쓰기 방지

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 👨‍💻 개발자

SSL-test-v2 개발팀
