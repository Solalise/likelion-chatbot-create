# Ollama 개인용 챗봇 실습

멋쟁이사자처럼 LLM 세미나용 예제입니다. 로컬에 설치된 Ollama 모델을 사용하고, 개인정보와 챗봇 성격은 JSON 파일로 분리했습니다.

## 준비

1. Ollama를 설치합니다.
2. 사용할 모델을 내려받습니다.

```powershell
ollama pull gemma3:1b
```

3. 개인정보 프롬프트를 수정합니다.

```text
prompts/personal-profile.json
```

처음 받았다면 예시 파일을 복사해서 만듭니다.

```powershell
Copy-Item prompts/personal-profile.example.json prompts/personal-profile.json
```

CMD를 쓰는 경우:

```cmd
copy prompts\personal-profile.example.json prompts\personal-profile.json
```

`model`에는 로컬에 내려받은 Ollama 모델명을 넣습니다. 예: `gemma3:1b`, `llama3.2`, `qwen2.5`

## 실행

```powershell
npm start
```

브라우저에서 `http://localhost:3000`을 엽니다.

Ollama 주소가 기본값과 다르면 환경변수를 지정합니다.

```powershell
$env:OLLAMA_HOST="http://localhost:11434"
npm start
```

CMD를 쓰는 경우:

```cmd
set OLLAMA_HOST=http://localhost:11434
npm start
```

## 오류 확인

화면에 `Ollama 연결됨`이 보여도 채팅에 사용할 모델이 설치되어 있지 않으면 답변 생성에서 오류가 날 수 있습니다.

1. `prompts/personal-profile.json`의 `model` 값을 확인합니다.
2. 같은 모델을 내려받습니다.

```powershell
ollama pull gemma3:1b
```

3. 서버를 다시 시작합니다.

```powershell
npm start
```

터미널에서 `ollama` 명령어를 찾을 수 없지만 앱 화면이 `Ollama 연결됨`으로 나온다면, Ollama 서버는 켜져 있고 CLI만 PATH에 잡히지 않은 상태일 수 있습니다. 이때는 Ollama 앱을 재실행하거나 새 터미널을 열어 다시 시도하세요.

## 구조

- `server.js`: 웹 UI 제공 및 Ollama `/api/chat` 프록시
- `public/`: ChatGPT 스타일 웹 UI
- `prompts/personal-profile.json`: 모델명, 개인정보, 응답 규칙
- `memory/*.json`: 세션별 대화 기록

왼쪽 사이드바의 대화 목록은 `memory/*.json` 파일을 읽어서 보여줍니다. 세션을 클릭하면 해당 JSON의 `messages`가 화면에 복원됩니다.

주의: 이 예제는 로컬 실습용입니다. 실제 개인정보를 넣은 파일은 GitHub 같은 공개 저장소에 올리지 마세요.
