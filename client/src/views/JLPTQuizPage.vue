<template>
  <div class="quiz-page">
    <AppHeader />

    <!-- Premium Gate -->
    <div v-if="!isPremiumUser" class="premium-gate">
      <div class="premium-gate-card">
        <div class="premium-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>{{ $t('jlpt.premiumOnly') }}</h2>
        <p>{{ $t('jlpt.premiumDesc') }}</p>
        <button class="btn-upgrade" @click="$router.push('/premium')">
          {{ $t('jlpt.upgradePremium') }}
        </button>
        <router-link to="/" class="back-link">{{ $t('auth.backToHome') }}</router-link>
      </div>
    </div>

    <!-- Quiz Content (for premium users) -->
    <div v-else class="quiz-content">
      <!-- Header Section -->
      <section class="quiz-hero">
        <div class="quiz-hero-content">
          <span class="quiz-badge">🎌 {{ $t('jlpt.badge') }}</span>
          <h1 class="quiz-title">
            {{ $t('jlpt.title') }} <span class="text-gold">{{ $t('jlpt.titleHighlight') }}</span>
          </h1>
          <p class="quiz-subtitle">{{ $t('jlpt.subtitle') }}</p>
        </div>
      </section>

      <!-- Tabs: Quiz / Leaderboard -->
      <section class="quiz-main">
        <div class="quiz-container">
          <div class="tab-bar">
            <button class="tab-btn" :class="{ active: activeTab === 'quiz' }" @click="activeTab = 'quiz'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              {{ $t('jlpt.quizTab') }}
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'leaderboard' }" @click="activeTab = 'leaderboard'; fetchLeaderboard()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 21V12H2L12 3l10 9h-6v9H8z"/>
              </svg>
              {{ $t('jlpt.leaderboardTab') }}
            </button>
          </div>

          <!-- QUIZ TAB -->
          <div v-if="activeTab === 'quiz'" class="quiz-panel">

            <!-- Start Screen -->
            <div v-if="gameState === 'idle'" class="start-screen">
              <div class="start-card">
                <div class="start-icon">🎴</div>
                <h2>{{ $t('jlpt.kanjiSoundQuiz') }}</h2>
                <p>{{ $t('jlpt.quizDescription') }}</p>
                <div class="quiz-rules">
                  <div class="rule">
                    <span class="rule-num">10</span>
                    <span>{{ $t('jlpt.rounds') }}</span>
                  </div>
                  <div class="rule">
                    <span class="rule-num">4</span>
                    <span>{{ $t('jlpt.choices') }}</span>
                  </div>
                  <div class="rule">
                    <span class="rule-num">⏱</span>
                    <span>{{ $t('jlpt.timeLimit') }}</span>
                  </div>
                </div>
                <button class="btn-start" @click="startGame">
                  {{ $t('jlpt.startQuiz') }}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Active Game -->
            <div v-else-if="gameState === 'playing'" class="game-area">
              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="progress-info">
                  <span class="round-label">{{ $t('jlpt.round') }} {{ currentRound }}/10</span>
                  <span class="score-label">{{ $t('jlpt.score') }}: {{ score }}/{{ currentRound - 1 }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${(currentRound / 10) * 100}%` }"></div>
                </div>
                <div class="timer-bar">
                  <div class="timer-fill" :class="{ warning: timeLeft <= 5, danger: timeLeft <= 3 }" :style="{ width: `${(timeLeft / 15) * 100}%` }"></div>
                </div>
                <span class="timer-text">{{ timeLeft }}s</span>
              </div>

              <!-- Question Card -->
              <div class="question-card" :class="{ 'card-flip': isFlipping }">
                <div class="question-label">{{ $t('jlpt.whatReading') }}</div>
                <div class="kanji-display">{{ currentQuestion.kanji }}</div>
                <div class="kanji-meaning">({{ currentQuestion.meaning }})</div>
              </div>

              <!-- Answer Options -->
              <div class="answers-grid">
                <button
                  v-for="(option, idx) in currentQuestion.options"
                  :key="idx"
                  class="answer-btn"
                  :class="{
                    correct: answered && option === currentQuestion.correctReading,
                    wrong: answered && selectedAnswer === option && option !== currentQuestion.correctReading,
                    disabled: answered
                  }"
                  :disabled="answered"
                  @click="selectAnswer(option)"
                >
                  <span class="answer-key">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
                  <span class="answer-text">{{ option }}</span>
                </button>
              </div>

              <!-- Feedback -->
              <Transition name="fade">
                <div v-if="answered" class="feedback" :class="isCorrect ? 'correct' : 'wrong'">
                  <span class="feedback-icon">{{ isCorrect ? '✅' : '❌' }}</span>
                  <span>{{ isCorrect ? $t('jlpt.correct') : $t('jlpt.wrongAnswer') + ': ' + currentQuestion.correctReading }}</span>
                </div>
              </Transition>
            </div>

            <!-- Results Screen -->
            <div v-else-if="gameState === 'finished'" class="results-screen">
              <div class="results-card">
                <div class="results-emoji">{{ getResultEmoji() }}</div>
                <h2>{{ $t('jlpt.quizComplete') }}</h2>
                <div class="final-score">
                  <span class="score-number">{{ score }}</span>
                  <span class="score-divider">/</span>
                  <span class="score-total">10</span>
                </div>
                <p class="score-message">{{ getScoreMessage() }}</p>

                <div class="results-stats">
                  <div class="stat">
                    <span class="stat-val correct-val">{{ score }}</span>
                    <span class="stat-label">{{ $t('jlpt.correctAnswers') }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-val wrong-val">{{ 10 - score }}</span>
                    <span class="stat-label">{{ $t('jlpt.wrongAnswers') }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-val">{{ score * 10 }}%</span>
                    <span class="stat-label">{{ $t('jlpt.accuracy') }}</span>
                  </div>
                </div>

                <!-- Points Earned -->
                <div v-if="pointsEarned > 0" class="points-earned-banner">
                  <div class="points-icon">🪙</div>
                  <div class="points-info">
                    <span class="points-amount">+{{ pointsEarned }} {{ $t('jlpt.pointsEarned') }}</span>
                    <span class="points-total">{{ $t('jlpt.totalPoints') }}: {{ totalPoints }}</span>
                  </div>
                  <router-link to="/points-shop" class="points-shop-link">{{ $t('jlpt.redeemPoints') }} →</router-link>
                </div>

                <!-- Review Wrong Answers -->
                <div v-if="wrongAnswers.length > 0" class="review-section">
                  <h3>{{ $t('jlpt.reviewMistakes') }}</h3>
                  <div class="review-list">
                    <div v-for="(item, idx) in wrongAnswers" :key="idx" class="review-item">
                      <span class="review-kanji">{{ item.kanji }}</span>
                      <span class="review-answer">{{ item.correctReading }}</span>
                      <span class="review-meaning">{{ item.meaning }}</span>
                    </div>
                  </div>
                </div>

                <div class="results-actions">
                  <button class="btn-start" @click="startGame">
                    {{ $t('jlpt.playAgain') }}
                  </button>
                  <button class="btn-secondary" @click="activeTab = 'leaderboard'; fetchLeaderboard()">
                    {{ $t('jlpt.viewLeaderboard') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- LEADERBOARD TAB -->
          <div v-if="activeTab === 'leaderboard'" class="leaderboard-panel">
            <div class="leaderboard-header">
              <h2>🏆 {{ $t('jlpt.topPlayers') }}</h2>
              <p>{{ $t('jlpt.leaderboardDesc') }}</p>
            </div>

            <div v-if="leaderboardLoading" class="leaderboard-loading">
              <div class="loading-spinner"></div>
              <span>{{ $t('common.loading') }}</span>
            </div>

            <div v-else-if="leaderboard.length === 0" class="leaderboard-empty">
              <span class="empty-icon">🏅</span>
              <p>{{ $t('jlpt.noScoresYet') }}</p>
              <button class="btn-start" @click="activeTab = 'quiz'">{{ $t('jlpt.beFirst') }}</button>
            </div>

            <div v-else class="leaderboard-table">
              <div class="lb-row lb-header-row">
                <span class="lb-rank">#</span>
                <span class="lb-name">{{ $t('jlpt.player') }}</span>
                <span class="lb-score">{{ $t('jlpt.score') }}</span>
                <span class="lb-date">{{ $t('jlpt.date') }}</span>
              </div>
              <div
                v-for="(entry, idx) in leaderboard"
                :key="entry.id"
                class="lb-row"
                :class="{ 'lb-top1': idx === 0, 'lb-top2': idx === 1, 'lb-top3': idx === 2, 'lb-self': entry.user_id === authStore.user?.id }"
              >
                <span class="lb-rank">
                  <span v-if="idx === 0" class="medal">🥇</span>
                  <span v-else-if="idx === 1" class="medal">🥈</span>
                  <span v-else-if="idx === 2" class="medal">🥉</span>
                  <span v-else>{{ idx + 1 }}</span>
                </span>
                <span class="lb-name">
                  <span class="lb-avatar">{{ entry.user_name?.charAt(0).toUpperCase() || '?' }}</span>
                  {{ entry.user_name || 'Anonymous' }}
                </span>
                <span class="lb-score">{{ entry.score }}/10</span>
                <span class="lb-date">{{ formatDate(entry.created_at) }}</span>
              </div>
            </div>

            <!-- Personal Best -->
            <div v-if="personalBest !== null" class="personal-best">
              <span class="pb-label">{{ $t('jlpt.yourBest') }}</span>
              <span class="pb-score">{{ personalBest }}/10</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="quiz-footer">
      <p>{{ $t('footer.copyright') }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
import AppHeader from '../components/layout/AppHeader.vue'

const { t } = useI18n()
const authStore = useAuthStore()

// Premium check - only premium members can access
const isPremiumUser = computed(() => authStore.user?.is_premium)

// Tabs
const activeTab = ref('quiz')

// Game State
const gameState = ref('idle') // idle | playing | finished
const currentRound = ref(1)
const score = ref(0)
const currentQuestion = ref({})
const selectedAnswer = ref(null)
const answered = ref(false)
const isCorrect = ref(false)
const isFlipping = ref(false)
const wrongAnswers = ref([])
const timeLeft = ref(15)
let timerInterval = null
let usedQuestionIndices = []

// Leaderboard
const leaderboard = ref([])
const leaderboardLoading = ref(false)
const personalBest = ref(null)
const pointsEarned = ref(0)
const totalPoints = ref(0)

// ==========================================
// JLPT N3 Kanji Data — Sound/Reading Quiz
// ==========================================
const kanjiData = [
  { kanji: '会議', correctReading: 'かいぎ', meaning: 'Meeting', wrongReadings: ['かいき', 'かぎ', 'あいぎ'] },
  { kanji: '経験', correctReading: 'けいけん', meaning: 'Experience', wrongReadings: ['きょうけん', 'けいげん', 'きけん'] },
  { kanji: '研究', correctReading: 'けんきゅう', meaning: 'Research', wrongReadings: ['けんく', 'げんきゅう', 'けんぐう'] },
  { kanji: '政治', correctReading: 'せいじ', meaning: 'Politics', wrongReadings: ['しょうじ', 'せいち', 'まさじ'] },
  { kanji: '産業', correctReading: 'さんぎょう', meaning: 'Industry', wrongReadings: ['さんごう', 'せんぎょう', 'さんきょう'] },
  { kanji: '自然', correctReading: 'しぜん', meaning: 'Nature', wrongReadings: ['じねん', 'しせん', 'じぜん'] },
  { kanji: '交通', correctReading: 'こうつう', meaning: 'Traffic', wrongReadings: ['こうとう', 'きょうつう', 'こうずう'] },
  { kanji: '制度', correctReading: 'せいど', meaning: 'System', wrongReadings: ['しど', 'せいと', 'さいど'] },
  { kanji: '技術', correctReading: 'ぎじゅつ', meaning: 'Technology', wrongReadings: ['きじゅつ', 'ぎじつ', 'きしゅつ'] },
  { kanji: '教育', correctReading: 'きょういく', meaning: 'Education', wrongReadings: ['きゅういく', 'きょうく', 'こういく'] },
  { kanji: '関係', correctReading: 'かんけい', meaning: 'Relationship', wrongReadings: ['かんかい', 'かんけ', 'がんけい'] },
  { kanji: '反対', correctReading: 'はんたい', meaning: 'Opposite', wrongReadings: ['はんだい', 'ほんたい', 'ばんたい'] },
  { kanji: '問題', correctReading: 'もんだい', meaning: 'Problem', wrongReadings: ['もだい', 'もんてい', 'とだい'] },
  { kanji: '決定', correctReading: 'けってい', meaning: 'Decision', wrongReadings: ['けつてい', 'けつじょう', 'きめてい'] },
  { kanji: '規則', correctReading: 'きそく', meaning: 'Rule', wrongReadings: ['きぞく', 'きのり', 'ぐそく'] },
  { kanji: '記念', correctReading: 'きねん', meaning: 'Memorial', wrongReadings: ['きめん', 'きなん', 'きえん'] },
  { kanji: '相談', correctReading: 'そうだん', meaning: 'Consultation', wrongReadings: ['あいだん', 'そうたん', 'しょうだん'] },
  { kanji: '設計', correctReading: 'せっけい', meaning: 'Design/Plan', wrongReadings: ['せつけい', 'もうけい', 'せきけい'] },
  { kanji: '調査', correctReading: 'ちょうさ', meaning: 'Investigation', wrongReadings: ['しらべさ', 'ちょうし', 'きょうさ'] },
  { kanji: '成功', correctReading: 'せいこう', meaning: 'Success', wrongReadings: ['なりこう', 'じょうこう', 'せいく'] },
  { kanji: '失敗', correctReading: 'しっぱい', meaning: 'Failure', wrongReadings: ['しつはい', 'しっぱ', 'しばい'] },
  { kanji: '練習', correctReading: 'れんしゅう', meaning: 'Practice', wrongReadings: ['ねりしゅう', 'れんしう', 'ねんしゅう'] },
  { kanji: '準備', correctReading: 'じゅんび', meaning: 'Preparation', wrongReadings: ['しゅんび', 'じゅんぴ', 'じゅんべ'] },
  { kanji: '説明', correctReading: 'せつめい', meaning: 'Explanation', wrongReadings: ['しょうめい', 'せつめ', 'せいめい'] },
  { kanji: '約束', correctReading: 'やくそく', meaning: 'Promise', wrongReadings: ['やくしょく', 'やくたば', 'わくそく'] },
  { kanji: '注意', correctReading: 'ちゅうい', meaning: 'Caution', wrongReadings: ['ちゅうぎ', 'そそい', 'じゅうい'] },
  { kanji: '想像', correctReading: 'そうぞう', meaning: 'Imagination', wrongReadings: ['しょうぞう', 'そうじょう', 'おもぞう'] },
  { kanji: '表現', correctReading: 'ひょうげん', meaning: 'Expression', wrongReadings: ['おもてげん', 'ひょうけん', 'ひょうえん'] },
  { kanji: '連絡', correctReading: 'れんらく', meaning: 'Contact', wrongReadings: ['つらなりらく', 'れんらき', 'ねんらく'] },
  { kanji: '努力', correctReading: 'どりょく', meaning: 'Effort', wrongReadings: ['ぬりょく', 'どりき', 'のりょく'] },
  { kanji: '確認', correctReading: 'かくにん', meaning: 'Confirmation', wrongReadings: ['たしにん', 'きゃくにん', 'かくじん'] },
  { kanji: '影響', correctReading: 'えいきょう', meaning: 'Influence', wrongReadings: ['かげひびき', 'えきょう', 'いんきょう'] },
  { kanji: '経済', correctReading: 'けいざい', meaning: 'Economy', wrongReadings: ['きょうざい', 'けいさい', 'けざい'] },
  { kanji: '選挙', correctReading: 'せんきょ', meaning: 'Election', wrongReadings: ['えらぶきょ', 'せんこ', 'ぜんきょ'] },
  { kanji: '比較', correctReading: 'ひかく', meaning: 'Comparison', wrongReadings: ['くらべかく', 'ひこう', 'ひがく'] },
  { kanji: '退院', correctReading: 'たいいん', meaning: 'Leave hospital', wrongReadings: ['たいえん', 'だいいん', 'しりぞきいん'] },
  { kanji: '貿易', correctReading: 'ぼうえき', meaning: 'Trade', wrongReadings: ['もうえき', 'ぼうやく', 'ぼうき'] },
  { kanji: '講演', correctReading: 'こうえん', meaning: 'Lecture', wrongReadings: ['きょうえん', 'こうべん', 'こえん'] },
  { kanji: '参加', correctReading: 'さんか', meaning: 'Participation', wrongReadings: ['さんが', 'まいか', 'しんか'] },
  { kanji: '複雑', correctReading: 'ふくざつ', meaning: 'Complicated', wrongReadings: ['おくざつ', 'ふくさつ', 'ふくぞう'] },
  { kanji: '環境', correctReading: 'かんきょう', meaning: 'Environment', wrongReadings: ['かんけい', 'わんきょう', 'かんぎょう'] },
  { kanji: '伝統', correctReading: 'でんとう', meaning: 'Tradition', wrongReadings: ['つたとう', 'でんすべ', 'てんとう'] },
  { kanji: '独立', correctReading: 'どくりつ', meaning: 'Independence', wrongReadings: ['ひとりりつ', 'どくり', 'どくだち'] },
  { kanji: '完成', correctReading: 'かんせい', meaning: 'Completion', wrongReadings: ['かんじょう', 'まんせい', 'がんせい'] },
  { kanji: '観光', correctReading: 'かんこう', meaning: 'Sightseeing', wrongReadings: ['みこう', 'かんみつ', 'がんこう'] },
  { kanji: '必要', correctReading: 'ひつよう', meaning: 'Necessary', wrongReadings: ['かなよう', 'ひつやく', 'びつよう'] },
  { kanji: '適当', correctReading: 'てきとう', meaning: 'Suitable', wrongReadings: ['まとあてる', 'てきど', 'できとう'] },
  { kanji: '発展', correctReading: 'はってん', meaning: 'Development', wrongReadings: ['はつてん', 'ほってん', 'はつのべ'] },
  { kanji: '判断', correctReading: 'はんだん', meaning: 'Judgment', wrongReadings: ['ばんだん', 'はんたん', 'はぜん'] },
  { kanji: '禁止', correctReading: 'きんし', meaning: 'Prohibition', wrongReadings: ['きんじ', 'ぎんし', 'こんし'] },
]

function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestion() {
  // Pick a random kanji not yet used
  let availableIndices = kanjiData
    .map((_, i) => i)
    .filter(i => !usedQuestionIndices.includes(i))

  if (availableIndices.length === 0) {
    // Reset if somehow exhausted
    usedQuestionIndices = []
    availableIndices = kanjiData.map((_, i) => i)
  }

  const idx = availableIndices[Math.floor(Math.random() * availableIndices.length)]
  usedQuestionIndices.push(idx)
  const data = kanjiData[idx]

  const options = shuffle([data.correctReading, ...data.wrongReadings])

  return {
    kanji: data.kanji,
    correctReading: data.correctReading,
    meaning: data.meaning,
    options
  }
}

function startGame() {
  gameState.value = 'playing'
  currentRound.value = 1
  score.value = 0
  wrongAnswers.value = []
  usedQuestionIndices = []
  loadQuestion()
}

function loadQuestion() {
  answered.value = false
  selectedAnswer.value = null
  isCorrect.value = false
  isFlipping.value = true
  setTimeout(() => { isFlipping.value = false }, 300)
  currentQuestion.value = generateQuestion()
  startTimer()
}

function startTimer() {
  clearInterval(timerInterval)
  timeLeft.value = 15
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      // Time's up — auto-answer wrong
      if (!answered.value) {
        answered.value = true
        isCorrect.value = false
        wrongAnswers.value.push({
          kanji: currentQuestion.value.kanji,
          correctReading: currentQuestion.value.correctReading,
          meaning: currentQuestion.value.meaning
        })
        setTimeout(nextRound, 1500)
      }
    }
  }, 1000)
}

function selectAnswer(option) {
  if (answered.value) return
  clearInterval(timerInterval)
  answered.value = true
  selectedAnswer.value = option
  isCorrect.value = option === currentQuestion.value.correctReading

  if (isCorrect.value) {
    score.value++
  } else {
    wrongAnswers.value.push({
      kanji: currentQuestion.value.kanji,
      correctReading: currentQuestion.value.correctReading,
      meaning: currentQuestion.value.meaning
    })
  }

  setTimeout(nextRound, 1500)
}

function nextRound() {
  if (currentRound.value >= 10) {
    finishGame()
  } else {
    currentRound.value++
    loadQuestion()
  }
}

async function finishGame() {
  gameState.value = 'finished'
  clearInterval(timerInterval)

  // Submit score to backend
  try {
    const res = await api.post('/quiz/scores', { score: score.value, total: 10, quiz_type: 'jlpt_n3_kanji_reading' })
    pointsEarned.value = res.data.pointsEarned || 0
    totalPoints.value = res.data.totalPoints || 0
    // Update user points in store
    if (authStore.user) {
      authStore.user.points = res.data.totalPoints || authStore.user.points
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
  } catch (err) {
    console.error('Failed to save score:', err)
  }
}

function getResultEmoji() {
  if (score.value === 10) return '🏆'
  if (score.value >= 8) return '🌟'
  if (score.value >= 6) return '👍'
  if (score.value >= 4) return '📚'
  return '💪'
}

function getScoreMessage() {
  if (score.value === 10) return t('jlpt.perfect')
  if (score.value >= 8) return t('jlpt.excellent')
  if (score.value >= 6) return t('jlpt.good')
  if (score.value >= 4) return t('jlpt.keepPracticing')
  return t('jlpt.dontGiveUp')
}

// Leaderboard
async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    const res = await api.get('/quiz/leaderboard?quiz_type=jlpt_n3_kanji_reading')
    leaderboard.value = res.data.leaderboard || []
    personalBest.value = res.data.personalBest ?? null
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err)
  } finally {
    leaderboardLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.quiz-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* ===== Premium Gate ===== */
.premium-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.premium-gate-card {
  text-align: center;
  max-width: 480px;
  padding: 3rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 1.5rem;
}

.premium-icon {
  margin-bottom: 1.5rem;
  color: var(--color-primary);
}

.premium-gate-card h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.premium-gate-card p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn-upgrade {
  display: inline-block;
  padding: 0.875rem 2.5rem;
  background: linear-gradient(135deg, var(--color-primary), #d4a853);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-upgrade:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.back-link {
  display: block;
  margin-top: 1rem;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

/* ===== Quiz Hero ===== */
.quiz-hero {
  padding: 3rem 2rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-light);
}

.quiz-badge {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.quiz-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.text-gold {
  color: var(--color-primary);
}

.quiz-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

/* ===== Tabs ===== */
.quiz-main {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.quiz-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 1.25rem;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border-light);
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: rgba(212, 175, 55, 0.05);
}

.tab-btn:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

/* ===== Start Screen ===== */
.start-screen {
  padding: 3rem 2rem;
  display: flex;
  justify-content: center;
}

.start-card {
  text-align: center;
  max-width: 420px;
}

.start-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.start-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.start-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.quiz-rules {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.rule {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-light);
}

.rule-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
}

.rule span:last-child {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-start {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2.5rem;
  background: linear-gradient(135deg, var(--color-primary), #d4a853);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--color-primary);
}

/* ===== Game Area ===== */
.game-area {
  padding: 2rem;
}

.progress-section {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.round-label {
  font-weight: 700;
  color: var(--text-primary);
}

.score-label {
  font-weight: 600;
  color: var(--color-primary);
}

.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #d4a853);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.timer-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.timer-fill {
  height: 100%;
  background: #4ade80;
  border-radius: 999px;
  transition: width 1s linear;
}

.timer-fill.warning {
  background: #fbbf24;
}

.timer-fill.danger {
  background: #ef4444;
}

.timer-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  text-align: right;
  display: block;
}

/* ===== Question Card ===== */
.question-card {
  text-align: center;
  padding: 2rem;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-light);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  transition: transform 0.3s;
}

.question-card.card-flip {
  transform: rotateY(10deg) scale(0.97);
}

.question-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.kanji-display {
  font-size: 4rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1.2;
  font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif;
}

.kanji-meaning {
  font-size: 1rem;
  color: var(--text-tertiary);
  margin-top: 0.5rem;
}

/* ===== Answer Grid ===== */
.answers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-light);
  border-radius: 0.75rem;
  font-size: 1.1rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: 'Noto Sans JP', sans-serif;
}

.answer-btn:hover:not(.disabled) {
  border-color: var(--color-primary);
  background: rgba(212, 175, 55, 0.08);
  transform: translateY(-2px);
}

.answer-btn.correct {
  background: rgba(74, 222, 128, 0.15);
  border-color: #4ade80;
  color: #16a34a;
}

.answer-btn.wrong {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #dc2626;
}

.answer-btn.disabled {
  cursor: default;
  opacity: 0.7;
}

.answer-key {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.answer-text {
  flex: 1;
}

/* ===== Feedback ===== */
.feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.feedback.correct {
  background: rgba(74, 222, 128, 0.12);
  color: #16a34a;
}

.feedback.wrong {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== Results ===== */
.results-screen {
  padding: 2rem;
}

.results-card {
  text-align: center;
}

.results-emoji {
  font-size: 4rem;
  margin-bottom: 0.5rem;
}

.results-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.final-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.score-number {
  font-size: 4rem;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
}

.score-divider {
  font-size: 2rem;
  color: var(--text-tertiary);
}

.score-total {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-tertiary);
}

.score-message {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-val.correct-val {
  color: #16a34a;
}

.stat-val.wrong-val {
  color: #dc2626;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Points Earned Banner */
.points-earned-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
}

.points-icon {
  font-size: 2rem;
}

.points-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.points-amount {
  font-size: 1.125rem;
  font-weight: 800;
  color: #92400e;
}

.points-total {
  font-size: 0.8rem;
  color: #b45309;
}

.points-shop-link {
  color: #92400e;
  font-weight: 700;
  font-size: 0.85rem;
  text-decoration: none;
  white-space: nowrap;
}

.points-shop-link:hover {
  text-decoration: underline;
}

.review-section {
  margin-bottom: 2rem;
  text-align: left;
}

.review-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  text-align: center;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-light);
}

.review-kanji {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  min-width: 60px;
  font-family: 'Noto Sans JP', sans-serif;
}

.review-answer {
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  font-family: 'Noto Sans JP', sans-serif;
}

.review-meaning {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-left: auto;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ===== Leaderboard ===== */
.leaderboard-panel {
  padding: 2rem;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.leaderboard-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.leaderboard-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.leaderboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-tertiary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.leaderboard-empty {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.leaderboard-empty p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.leaderboard-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lb-row {
  display: grid;
  grid-template-columns: 50px 1fr 80px 80px;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  gap: 0.5rem;
}

.lb-header-row {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-light);
}

.lb-row:not(.lb-header-row) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
}

.lb-top1 {
  background: rgba(255, 215, 0, 0.08) !important;
  border-color: rgba(255, 215, 0, 0.3) !important;
}

.lb-top2 {
  background: rgba(192, 192, 192, 0.08) !important;
  border-color: rgba(192, 192, 192, 0.3) !important;
}

.lb-top3 {
  background: rgba(205, 127, 50, 0.08) !important;
  border-color: rgba(205, 127, 50, 0.3) !important;
}

.lb-self {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 1px var(--color-primary);
}

.lb-rank {
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.medal {
  font-size: 1.25rem;
}

.lb-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lb-avatar {
  display: inline-flex;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--color-primary), #d4a853);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lb-score {
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}

.lb-date {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  text-align: right;
}

.personal-best {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 0.75rem;
}

.pb-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.pb-score {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary);
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .quiz-title {
    font-size: 1.5rem;
  }

  .kanji-display {
    font-size: 3rem;
  }

  .answers-grid {
    grid-template-columns: 1fr;
  }

  .quiz-rules {
    gap: 0.75rem;
  }

  .rule {
    padding: 0.5rem 0.75rem;
  }

  .lb-row {
    grid-template-columns: 40px 1fr 60px;
  }

  .lb-date {
    display: none;
  }

  .lb-header-row .lb-date {
    display: none;
  }

  .results-stats {
    gap: 1rem;
  }

  .final-score .score-number {
    font-size: 3rem;
  }
}

.quiz-footer {
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary);
  font-size: 0.875rem;
  border-top: 1px solid var(--border-light);
  margin-top: 2rem;
}
</style>
