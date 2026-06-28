const messagesEl = document.querySelector('#messages')
const formEl = document.querySelector('#chatForm')
const inputEl = document.querySelector('#promptInput')
const sendButton = document.querySelector('#sendButton')
const newChatButton = document.querySelector('#newChatButton')
const sessionListEl = document.querySelector('#sessionList')
const modelSelect = document.querySelector('#modelSelect')
const temperatureRange = document.querySelector('#temperatureRange')
const temperatureValue = document.querySelector('#temperatureValue')
const statusEl = document.querySelector('#status')

let messages = []
let isStreaming = false
let currentSessionId = null

const emptyStateHtml = `
  <div class="empty-state">
    <h2>무엇을 물어볼까요?</h2>
    <div class="suggestions">
      <button type="button" data-prompt="웹해킹을 어떤 순서로 공부해야할지 공부순서 작성해줘.">웹해킹 공부순서</button>
      <button type="button" data-prompt="취업 준비를 위해 해야 할 것들을 순서대로 작성한 로드맵 세워줘.">취업 로드맵</button>
      <button type="button" data-prompt="현재 내 스펙을 보고 포트폴리오를 평가 후 피드백해줘.">포트폴리오 피드백</button>
    </div>
  </div>
`

function setStatus(text, type = '') {
  statusEl.textContent = text
  statusEl.className = `status ${type}`.trim()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function removeEmptyState() {
  const empty = messagesEl.querySelector('.empty-state')
  if (empty) empty.remove()
}

function renderEmptyState() {
  messagesEl.innerHTML = emptyStateHtml
}

function addMessage(role, content = '', options = {}) {
  removeEmptyState()

  const messageEl = document.createElement('article')
  messageEl.className = `message ${role}${options.loading ? ' loading' : ''}`

  const avatarEl = document.createElement('div')
  avatarEl.className = 'avatar'
  avatarEl.textContent = role === 'assistant' ? 'AI' : '나'

  const bubbleEl = document.createElement('div')
  bubbleEl.className = 'bubble'
  bubbleEl.innerHTML = escapeHtml(content)

  messageEl.append(avatarEl, bubbleEl)
  messagesEl.append(messageEl)
  messagesEl.scrollTop = messagesEl.scrollHeight
  return { messageEl, bubbleEl }
}

function renderMessages(nextMessages) {
  messagesEl.innerHTML = ''

  if (!nextMessages.length) {
    renderEmptyState()
    return
  }

  nextMessages.forEach((message) => {
    addMessage(message.role, message.content)
  })
}

function setActiveSession() {
  sessionListEl.querySelectorAll('.session-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.sessionId === currentSessionId)
  })
}

function formatSessionDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function loadSessions() {
  try {
    const response = await fetch('/api/sessions')
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || '세션 목록을 불러오지 못했습니다.')

    if (!data.sessions.length) {
      sessionListEl.innerHTML =
        '<div class="session-empty">저장된 대화가 없습니다.</div>'
      return
    }

    sessionListEl.innerHTML = data.sessions
      .map(
        (session) => `
        <button class="session-item" type="button" data-session-id="${escapeHtml(session.id)}">
          <span>${escapeHtml(session.title || '새 대화')}</span>
          <small>${escapeHtml(formatSessionDate(session.updatedAt))}</small>
        </button>
      `,
      )
      .join('')
    setActiveSession()
  } catch (error) {
    sessionListEl.innerHTML = '<div class="session-empty">대화 목록 오류</div>'
    console.warn(error)
  }
}

async function openSession(sessionId) {
  if (isStreaming) return

  try {
    const response = await fetch(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
    )
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || '세션을 불러오지 못했습니다.')

    currentSessionId = data.session.id
    messages = Array.isArray(data.session.messages) ? data.session.messages : []
    renderMessages(messages)
    setActiveSession()
    setStatus('대화 불러옴', 'ready')
  } catch (error) {
    setStatus('대화 불러오기 실패', 'error')
    console.warn(error)
  }
}

function setInputHeight() {
  inputEl.style.height = 'auto'
  inputEl.style.height = `${Math.min(inputEl.scrollHeight, 180)}px`
}

async function loadModels() {
  try {
    const response = await fetch('/api/models')
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || '모델 목록을 불러오지 못했습니다.')

    const defaultOption = modelSelect.querySelector('option[value=""]')
    if (defaultOption && data.configuredModel) {
      defaultOption.textContent = `JSON 기본 모델 (${data.configuredModel})`
    }

    data.models.forEach((model) => {
      const option = document.createElement('option')
      option.value = model
      option.textContent = model
      modelSelect.append(option)
    })

    if (!data.models.length) {
      setStatus('설치된 모델 없음', 'error')
      return
    }

    if (data.configuredModel && !data.configuredModelAvailable) {
      setStatus(`${data.configuredModel} 설치 필요`, 'error')
      return
    }

    setStatus('Ollama 연결됨', 'ready')
  } catch (error) {
    setStatus('Ollama 연결 실패', 'error')
    console.warn(error)
  }
}

async function sendMessage(text) {
  if (!text.trim() || isStreaming) return

  const userContent = text.trim()
  messages.push({ role: 'user', content: userContent })
  addMessage('user', userContent)

  inputEl.value = ''
  setInputHeight()
  isStreaming = true
  sendButton.disabled = true
  setStatus('답변 생성 중', 'ready')

  const { messageEl: assistantMessage, bubbleEl: assistantBubble } = addMessage(
    'assistant',
    '',
    {
      loading: true,
    },
  )
  let assistantContent = ''

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        messages,
        model: modelSelect.value || undefined,
        temperature: Number(temperatureRange.value),
      }),
    })

    if (!response.ok || !response.body) {
      const error = await response.json().catch(() => ({}))
      const message = [error.error, error.detail].filter(Boolean).join('\n')
      throw new Error(message || '응답을 받을 수 없습니다.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const eventText of events) {
        const dataLine = eventText
          .split('\n')
          .find((line) => line.startsWith('data: '))
        if (!dataLine) continue

        const data = JSON.parse(dataLine.slice(6))
        if (data.sessionId) {
          currentSessionId = data.sessionId
        }
        if (data.error) {
          throw new Error(data.error)
        }
        if (data.content) {
          assistantMessage.classList.remove('loading')
          assistantContent += data.content
          assistantBubble.innerHTML = escapeHtml(assistantContent)
          messagesEl.scrollTop = messagesEl.scrollHeight
        }
      }
    }

    messages.push({ role: 'assistant', content: assistantContent })
    await loadSessions()
    setStatus('Ollama 연결됨', 'ready')
  } catch (error) {
    assistantMessage.classList.remove('loading')
    assistantBubble.innerHTML = escapeHtml(`오류: ${error.message}`)
    setStatus('오류 발생', 'error')
  } finally {
    assistantMessage.classList.remove('loading')
    isStreaming = false
    sendButton.disabled = false
    inputEl.focus()
  }
}

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  sendMessage(inputEl.value)
})

inputEl.addEventListener('input', setInputHeight)
inputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    formEl.requestSubmit()
  }
})

messagesEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-prompt]')
  if (!button || isStreaming) return
  sendMessage(button.dataset.prompt)
})

newChatButton.addEventListener('click', () => {
  messages = []
  currentSessionId = null
  renderEmptyState()
  setActiveSession()
  inputEl.focus()
})

sessionListEl.addEventListener('click', (event) => {
  const item = event.target.closest('[data-session-id]')
  if (item) openSession(item.dataset.sessionId)
})

messagesEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-prompt]')
  if (button) sendMessage(button.dataset.prompt)
})

temperatureRange.addEventListener('input', () => {
  temperatureValue.textContent = temperatureRange.value
})

loadModels()
loadSessions()
setInputHeight()
