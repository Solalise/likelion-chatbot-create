# 진로상담 챗봇

이 프로젝트는 프롬프트 엔지니어링을 활용해 자신만의 진로상담 챗봇을 만드는 예제입니다. 로컬 Ollama 모델과 웹 UI를 연결해, 사용자의 진로 고민에 대해 실용적인 조언을 제공하도록 설계했습니다.

## 핵심 기능

- 진로 고민, 직무 탐색, 학습 계획을 도와주는 AI 상담 기능
- 프롬프트 파일로 챗봇 역할과 응답 규칙을 분리하여 관리
- 대화 세션을 저장해 이전 대화를 이어서 볼 수 있는 기능

## 실행 방법

1. Ollama를 설치하고 모델을 내려받습니다.

```powershell
ollama pull gemma3:1b
```

2. 프롬프트 설정 파일을 준비합니다.

```powershell
Copy-Item prompts/personal-profile.example.json prompts/personal-profile.json
```

3. 서버를 실행합니다.

```powershell
npm start
```

4. 브라우저에서 `http://localhost:3000`으로 접속합니다.

## 프로젝트 구조

- `server.js`: 서버 로직과 Ollama 요청 처리
- `public/`: 웹 UI와 채팅 인터페이스
- `prompts/personal-profile.json`: 챗봇 역할, 프로필, 응답 규칙 설정
- `memory/`: 대화 세션 저장 폴더

## 발표 포인트

- 프롬프트를 바꾸는 것만으로 챗봇의 역할과 말투를 바꿀 수 있다.
- 사용자 입력에 맞춰 진로 상담형 응답을 생성하도록 설계했다.
- UI와 서버를 분리해, 챗봇 기능을 쉽게 확장할 수 있다.
