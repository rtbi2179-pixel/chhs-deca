/*
 * CHHS DECA Practice Questions Page — Cinematic Dark Editorial
 * Interactive quiz with real DECA-style questions across all clusters
 * Tracks score, shows explanations, filters by cluster
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, ChevronRight, RotateCcw, BookOpen, ExternalLink, Trophy, Target, Zap } from 'lucide-react'

const PRACTICE_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/deca-practice-bg-4gcqhBvfXfPnfvvW3USqQA.webp'

type QuizCluster = 'All' | 'Marketing' | 'Finance' | 'Hospitality & Tourism' | 'Business Management' | 'Entrepreneurship' | 'Personal Finance'

interface Question {
  id: number
  cluster: QuizCluster
  question: string
  options: string[]
  correct: number
  explanation: string
}

const questions: Question[] = [
  // MARKETING
  { id: 1, cluster: 'Marketing', question: 'Which of the following best describes the concept of market segmentation?', options: ['Selling the same product to all consumers', 'Dividing a market into distinct groups with similar needs', 'Reducing the price of a product to increase sales', 'Expanding a business into international markets'], correct: 1, explanation: 'Market segmentation involves dividing a broad market into subsets of consumers who have common needs or characteristics.' },
  { id: 2, cluster: 'Marketing', question: 'A company that uses the same marketing mix for all market segments is using which strategy?', options: ['Differentiated marketing', 'Concentrated marketing', 'Undifferentiated (mass) marketing', 'Niche marketing'], correct: 2, explanation: 'Undifferentiated (mass) marketing ignores market segment differences and goes after the whole market with one offer.' },
  { id: 3, cluster: 'Marketing', question: 'Which element of the marketing mix refers to the amount of money customers must pay to obtain a product?', options: ['Product', 'Place', 'Price', 'Promotion'], correct: 2, explanation: 'Price is the amount of money charged for a product or service, or the sum of the values that customers exchange for the benefits of having or using the product.' },
  { id: 4, cluster: 'Marketing', question: 'SUGGING refers to:', options: ['A legitimate sales technique', 'Selling under the guise of conducting a survey', 'A type of market research', 'Strategic upselling to customers'], correct: 1, explanation: 'SUGGING (Selling Under the Guise of research) is an unethical practice where salespeople pretend to conduct research while actually trying to sell products.' },
  { id: 5, cluster: 'Marketing', question: 'Which type of distribution channel involves selling directly from producer to consumer with no intermediaries?', options: ['Indirect channel', 'Direct channel', 'Dual distribution', 'Reverse channel'], correct: 1, explanation: 'A direct channel (zero-level) has no intermediaries between the producer and consumer, such as a manufacturer selling directly online.' },
  { id: 6, cluster: 'Marketing', question: 'Brand equity refers to:', options: ['The monetary value of a brand\'s physical assets', 'The added value a brand name gives to a product', 'The cost of creating a brand identity', 'The number of products under a brand'], correct: 1, explanation: 'Brand equity is the commercial value that derives from consumer perception of the brand name of a particular product or service.' },
  { id: 7, cluster: 'Marketing', question: 'Which pricing strategy sets a high initial price and then gradually lowers it?', options: ['Penetration pricing', 'Skimming pricing', 'Competitive pricing', 'Cost-plus pricing'], correct: 1, explanation: 'Price skimming sets a high initial price for a new product to maximize revenue from early adopters before lowering the price.' },
  { id: 8, cluster: 'Marketing', question: 'The primary purpose of a SWOT analysis is to:', options: ['Determine product pricing', 'Evaluate strengths, weaknesses, opportunities, and threats', 'Create an advertising campaign', 'Measure customer satisfaction'], correct: 1, explanation: 'SWOT analysis is a strategic planning tool used to identify Strengths, Weaknesses, Opportunities, and Threats facing a business.' },

  // FINANCE
  { id: 9, cluster: 'Finance', question: 'The current ratio is calculated as:', options: ['Net income / Total assets', 'Current assets / Current liabilities', 'Total liabilities / Total equity', 'Gross profit / Net sales'], correct: 1, explanation: 'The current ratio measures a company\'s ability to pay short-term obligations: Current Assets ÷ Current Liabilities.' },
  { id: 10, cluster: 'Finance', question: 'Which financial statement shows a company\'s revenues and expenses over a period of time?', options: ['Balance sheet', 'Income statement', 'Cash flow statement', 'Statement of retained earnings'], correct: 1, explanation: 'The income statement (profit and loss statement) shows revenues, expenses, and net income over a specific accounting period.' },
  { id: 11, cluster: 'Finance', question: 'Accounts receivable represents:', options: ['Money a company owes to suppliers', 'Money customers owe to the company', 'Cash held in bank accounts', 'Long-term investments'], correct: 1, explanation: 'Accounts receivable is money owed to a company by its customers for goods or services already delivered.' },
  { id: 12, cluster: 'Finance', question: 'Which of the following is an example of a variable cost?', options: ['Rent', 'Insurance premiums', 'Raw materials', 'Depreciation'], correct: 2, explanation: 'Variable costs change in proportion to production volume. Raw materials increase as more units are produced.' },
  { id: 13, cluster: 'Finance', question: 'The break-even point is where:', options: ['Total revenue equals total costs', 'Profit is maximized', 'Fixed costs equal variable costs', 'Revenue exceeds expenses by 10%'], correct: 0, explanation: 'The break-even point is the level of production at which total revenues equal total costs, resulting in neither profit nor loss.' },
  { id: 14, cluster: 'Finance', question: 'A bond\'s coupon rate refers to:', options: ['The bond\'s market price', 'The annual interest rate paid to bondholders', 'The bond\'s maturity date', 'The discount rate used to value the bond'], correct: 1, explanation: 'The coupon rate is the annual interest rate paid on a bond, expressed as a percentage of the face value.' },
  { id: 15, cluster: 'Finance', question: 'Working capital is defined as:', options: ['Total assets minus total liabilities', 'Current assets minus current liabilities', 'Long-term assets minus long-term liabilities', 'Net income plus depreciation'], correct: 1, explanation: 'Working capital = Current Assets - Current Liabilities. It measures a company\'s short-term financial health and operational efficiency.' },
  { id: 16, cluster: 'Finance', question: 'Which investment type typically offers the highest potential return AND highest risk?', options: ['Government bonds', 'Money market accounts', 'Common stocks', 'Certificates of deposit'], correct: 2, explanation: 'Common stocks offer the highest potential returns but also carry the highest risk due to market volatility and no guaranteed returns.' },

  // HOSPITALITY & TOURISM
  { id: 17, cluster: 'Hospitality & Tourism', question: 'RevPAR (Revenue Per Available Room) is calculated as:', options: ['Total room revenue / Number of rooms sold', 'Total room revenue / Total rooms available', 'Average daily rate × Occupancy rate', 'Both B and C are correct'], correct: 3, explanation: 'RevPAR = Total Room Revenue ÷ Total Rooms Available, which is equivalent to ADR × Occupancy Rate. Both formulas yield the same result.' },
  { id: 18, cluster: 'Hospitality & Tourism', question: 'Which of the following best describes yield management?', options: ['Reducing operational costs', 'Maximizing revenue by adjusting prices based on demand', 'Managing employee performance', 'Controlling food waste in restaurants'], correct: 1, explanation: 'Yield (revenue) management is a variable pricing strategy based on understanding, anticipating, and influencing consumer behavior to maximize revenue.' },
  { id: 19, cluster: 'Hospitality & Tourism', question: 'The Americans with Disabilities Act (ADA) requires hotels to:', options: ['Provide free meals to disabled guests', 'Offer accessible accommodations and facilities', 'Hire a minimum percentage of disabled employees', 'Reduce room rates for disabled guests'], correct: 1, explanation: 'The ADA requires hotels and other public accommodations to provide accessible facilities and services for guests with disabilities.' },
  { id: 20, cluster: 'Hospitality & Tourism', question: 'A hotel\'s occupancy rate is calculated as:', options: ['Rooms sold / Total rooms available × 100', 'Revenue / Total rooms × 100', 'Guests served / Capacity × 100', 'Bookings / Inquiries × 100'], correct: 0, explanation: 'Occupancy rate = (Rooms Sold ÷ Total Rooms Available) × 100. It measures the percentage of available rooms that are occupied.' },
  { id: 21, cluster: 'Hospitality & Tourism', question: 'Which term describes the practice of accepting more reservations than available capacity?', options: ['Double booking', 'Overbooking', 'Waitlisting', 'Capacity management'], correct: 1, explanation: 'Overbooking is intentionally accepting more reservations than available rooms/seats to account for expected no-shows and cancellations.' },
  { id: 22, cluster: 'Hospitality & Tourism', question: 'The primary goal of a front desk manager in a hotel is to:', options: ['Maximize food and beverage revenue', 'Ensure guest satisfaction and efficient check-in/out processes', 'Manage housekeeping staff', 'Control the hotel\'s marketing budget'], correct: 1, explanation: 'The front desk manager oversees guest services, check-in/check-out procedures, and serves as the primary point of contact for guest needs.' },

  // BUSINESS MANAGEMENT
  { id: 23, cluster: 'Business Management', question: 'Which management style involves employees in decision-making processes?', options: ['Autocratic', 'Democratic (participative)', 'Laissez-faire', 'Transactional'], correct: 1, explanation: 'Democratic (participative) management involves employees in the decision-making process, which can increase job satisfaction and commitment.' },
  { id: 24, cluster: 'Business Management', question: 'Maslow\'s Hierarchy of Needs lists which as the highest level?', options: ['Safety needs', 'Social needs', 'Esteem needs', 'Self-actualization'], correct: 3, explanation: 'Maslow\'s hierarchy: Physiological → Safety → Social → Esteem → Self-actualization (highest). Self-actualization is achieving one\'s full potential.' },
  { id: 25, cluster: 'Business Management', question: 'The process of comparing business practices to industry best performers is called:', options: ['Auditing', 'Benchmarking', 'Forecasting', 'Budgeting'], correct: 1, explanation: 'Benchmarking is the practice of comparing business processes and performance metrics to industry bests or best practices from other companies.' },
  { id: 26, cluster: 'Business Management', question: 'Which of the following is an example of a company\'s intangible asset?', options: ['Machinery', 'Inventory', 'Brand reputation', 'Real estate'], correct: 2, explanation: 'Intangible assets lack physical substance. Brand reputation, patents, trademarks, and goodwill are examples of intangible assets.' },
  { id: 27, cluster: 'Business Management', question: 'The "span of control" in management refers to:', options: ['The geographic area a manager oversees', 'The number of employees a manager directly supervises', 'The budget a manager controls', 'The time period of a manager\'s authority'], correct: 1, explanation: 'Span of control refers to the number of subordinates that a manager or supervisor can directly control and is responsible for.' },
  { id: 28, cluster: 'Business Management', question: 'Which business structure offers limited liability to all owners while avoiding double taxation?', options: ['Sole proprietorship', 'General partnership', 'Limited Liability Company (LLC)', 'C-Corporation'], correct: 2, explanation: 'An LLC combines the liability protection of a corporation with the tax benefits of a partnership, avoiding double taxation.' },

  // ENTREPRENEURSHIP
  { id: 29, cluster: 'Entrepreneurship', question: 'A business plan\'s executive summary should be:', options: ['The most detailed section', 'Written first before other sections', 'A concise overview written last', 'At least 10 pages long'], correct: 2, explanation: 'The executive summary is a concise overview of the entire business plan and is typically written last, after all other sections are complete.' },
  { id: 30, cluster: 'Entrepreneurship', question: 'Which funding source involves exchanging ownership equity for capital?', options: ['Bank loan', 'Angel investor', 'Government grant', 'Bootstrapping'], correct: 1, explanation: 'Angel investors provide capital in exchange for ownership equity or convertible debt. They take an ownership stake in the business.' },
  { id: 31, cluster: 'Entrepreneurship', question: 'A unique selling proposition (USP) is:', options: ['A legal protection for a business idea', 'What makes a product/service different from competitors', 'The initial price set for a new product', 'A type of business partnership agreement'], correct: 1, explanation: 'A USP is the factor or consideration presented by a seller as the reason that one product or service is different from and better than that of the competition.' },
  { id: 32, cluster: 'Entrepreneurship', question: 'The "lean startup" methodology emphasizes:', options: ['Raising maximum funding before launching', 'Building a complete product before testing', 'Build-Measure-Learn feedback loops', 'Hiring a large team immediately'], correct: 2, explanation: 'The lean startup methodology uses Build-Measure-Learn feedback loops to quickly iterate and validate business hypotheses with minimum waste.' },
  { id: 33, cluster: 'Entrepreneurship', question: 'What is a "pivot" in entrepreneurship?', options: ['A type of financial instrument', 'A fundamental change in business strategy', 'The initial launch of a product', 'A marketing technique'], correct: 1, explanation: 'A pivot is a structured course correction designed to test a new fundamental hypothesis about the product, strategy, and engine of growth.' },

  // PERSONAL FINANCE
  { id: 34, cluster: 'Personal Finance', question: 'The Rule of 72 is used to estimate:', options: ['Tax liability on investments', 'How long it takes to double an investment', 'Monthly mortgage payments', 'Credit score improvement time'], correct: 1, explanation: 'The Rule of 72: divide 72 by the annual interest rate to estimate how many years it takes for an investment to double.' },
  { id: 35, cluster: 'Personal Finance', question: 'A FICO credit score range is:', options: ['0-500', '300-850', '100-1000', '500-900'], correct: 1, explanation: 'FICO scores range from 300 to 850. Scores above 670 are considered "good," above 740 are "very good," and above 800 are "exceptional."' },
  { id: 36, cluster: 'Personal Finance', question: 'Which retirement account allows contributions with after-tax dollars but tax-free withdrawals?', options: ['Traditional IRA', 'Roth IRA', '401(k)', 'SEP IRA'], correct: 1, explanation: 'A Roth IRA is funded with after-tax dollars, but qualified withdrawals in retirement are tax-free, including earnings.' },
  { id: 37, cluster: 'Personal Finance', question: 'Dollar-cost averaging is a strategy where you:', options: ['Invest a lump sum when prices are lowest', 'Invest fixed amounts at regular intervals regardless of price', 'Only invest in dollar-denominated assets', 'Diversify equally across all asset classes'], correct: 1, explanation: 'Dollar-cost averaging involves investing a fixed dollar amount at regular intervals, regardless of share price, reducing the impact of volatility.' },
  { id: 38, cluster: 'Personal Finance', question: 'The debt-to-income ratio (DTI) is important because:', options: ['It determines your tax bracket', 'Lenders use it to evaluate loan eligibility', 'It calculates your net worth', 'It measures investment returns'], correct: 1, explanation: 'DTI ratio (monthly debt payments ÷ gross monthly income) is used by lenders to measure an individual\'s ability to manage monthly payments and repay debts.' },
]

const clusterFilters: QuizCluster[] = ['All', 'Marketing', 'Finance', 'Hospitality & Tourism', 'Business Management', 'Entrepreneurship', 'Personal Finance']

const clusterColors: Record<QuizCluster, string> = {
  'All': 'bg-white/10 text-white border-white/20',
  'Marketing': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Finance': 'bg-green-500/15 text-green-300 border-green-500/30',
  'Hospitality & Tourism': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Business Management': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Entrepreneurship': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'Personal Finance': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
}

export default function Practice() {
  const [selectedCluster, setSelectedCluster] = useState<QuizCluster>('All')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, boolean>>({})

  const filteredQuestions = selectedCluster === 'All'
    ? questions
    : questions.filter(q => q.cluster === selectedCluster)

  const currentQuestion = filteredQuestions[currentIndex]

  const handleClusterChange = useCallback((cluster: QuizCluster) => {
    setSelectedCluster(cluster)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    setAnswered(0)
    setSessionAnswers({})
  }, [])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(optionIndex)
    setShowExplanation(true)
    const isCorrect = optionIndex === currentQuestion.correct
    if (isCorrect) setScore(s => s + 1)
    setAnswered(a => a + 1)
    setSessionAnswers(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))
  }, [selectedAnswer, currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }, [currentIndex, filteredQuestions.length])

  const handleReset = useCallback(() => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    setAnswered(0)
    setSessionAnswers({})
  }, [])

  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0
  const isLastQuestion = currentIndex === filteredQuestions.length - 1

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* Header */}
      <div
        className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          backgroundImage: `url(${PRACTICE_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.07_0.01_265/0.6)] via-[oklch(0.07_0.01_265/0.85)] to-[oklch(0.07_0.01_265)]" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
            {questions.length}+ Practice Questions
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">PRACTICE EXAM</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Real DECA-style questions across all career clusters. Practice, learn from explanations, and track your score.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Score Card */}
            <div className="glass-card p-5">
              <h3 className="text-white/60 text-xs font-mono-data tracking-widest uppercase mb-4">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Score</span>
                  <span className="text-white font-bold font-mono-data">{score}/{answered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Accuracy</span>
                  <span className={`font-bold font-mono-data ${accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Progress</span>
                  <span className="text-white font-mono-data text-sm">{currentIndex + 1}/{filteredQuestions.length}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-sm transition-all"
              >
                <RotateCcw size={13} />
                Reset Session
              </button>
            </div>

            {/* Cluster Filter */}
            <div className="glass-card p-5">
              <h3 className="text-white/60 text-xs font-mono-data tracking-widest uppercase mb-3">Filter by Cluster</h3>
              <div className="space-y-1.5">
                {clusterFilters.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleClusterChange(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      selectedCluster === c
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/3 border-white/8 text-white/50 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {c}
                    <span className="float-right text-white/30">
                      {c === 'All' ? questions.length : questions.filter(q => q.cluster === c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* External Resources */}
            <div className="glass-card p-5">
              <h3 className="text-white/60 text-xs font-mono-data tracking-widest uppercase mb-3">More Practice</h3>
              <div className="space-y-2">
                {[
                  { label: 'Decademy (40k+ Qs)', url: 'https://decademy.app/practice' },
                  { label: 'TeachDECA Exams', url: 'https://teachdeca.org/' },
                  { label: 'Quizlet DECA Sets', url: 'https://quizlet.com/subject/deca/' },
                  { label: 'DECA Exam Blueprints', url: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints' },
                  { label: 'State High DECA Tests', url: 'https://sites.google.com/scasd.org/statehighdeca/practice-test-resources' },
                ].map(({ label, url }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-xs transition-all group"
                  >
                    {label}
                    <ExternalLink size={10} className="text-white/20 group-hover:text-white/50" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Main Quiz Area */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Question Card */}
                  <div className="glass-card p-8 mb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${clusterColors[currentQuestion.cluster]}`}>
                        {currentQuestion.cluster}
                      </span>
                      <span className="text-white/30 text-sm font-mono-data">
                        Q{currentIndex + 1} of {filteredQuestions.length}
                      </span>
                    </div>

                    {/* Question */}
                    <h2 className="text-white text-xl font-semibold leading-relaxed mb-8">
                      {currentQuestion.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, i) => {
                        const isSelected = selectedAnswer === i
                        const isCorrect = i === currentQuestion.correct
                        const showResult = selectedAnswer !== null

                        let optionClass = 'border-white/10 bg-white/3 text-white/70 hover:border-white/20 hover:bg-white/6 hover:text-white'
                        if (showResult) {
                          if (isCorrect) optionClass = 'border-green-500/50 bg-green-500/10 text-green-300'
                          else if (isSelected && !isCorrect) optionClass = 'border-red-500/50 bg-red-500/10 text-red-300'
                          else optionClass = 'border-white/5 bg-white/2 text-white/30'
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 ${optionClass} ${selectedAnswer === null ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold font-mono-data transition-colors ${
                              showResult && isCorrect ? 'border-green-500 bg-green-500/20 text-green-300' :
                              showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-500/20 text-red-300' :
                              'border-white/20 text-white/40'
                            }`}>
                              {showResult && isCorrect ? <CheckCircle size={14} /> :
                               showResult && isSelected && !isCorrect ? <XCircle size={14} /> :
                               String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-sm leading-relaxed">{option}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className={`p-5 rounded-xl border ${
                            selectedAnswer === currentQuestion.correct
                              ? 'bg-green-500/8 border-green-500/20'
                              : 'bg-blue-500/8 border-blue-500/20'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {selectedAnswer === currentQuestion.correct
                                ? <CheckCircle size={16} className="text-green-400" />
                                : <BookOpen size={16} className="text-blue-400" />
                              }
                              <span className={`text-sm font-semibold ${
                                selectedAnswer === currentQuestion.correct ? 'text-green-400' : 'text-blue-400'
                              }`}>
                                {selectedAnswer === currentQuestion.correct ? 'Correct!' : 'Explanation'}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next Button */}
                    {selectedAnswer !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 flex justify-end"
                      >
                        {!isLastQuestion ? (
                          <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]"
                          >
                            Next Question
                            <ChevronRight size={16} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-white/60 text-sm">
                              Session complete! Score: <span className="text-white font-bold">{score}/{answered}</span>
                            </div>
                            <button
                              onClick={handleReset}
                              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                            >
                              <RotateCcw size={14} />
                              Restart
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Achievement Banner */}
            {answered >= 5 && accuracy >= 80 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-5 border-yellow-500/20 bg-yellow-500/5"
              >
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-yellow-400" />
                  <div>
                    <div className="text-yellow-300 font-semibold text-sm">ICDC Ready!</div>
                    <div className="text-white/50 text-xs">You're scoring {accuracy}% — keep up the great work!</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tips Card */}
            <div className="mt-4 glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-blue-400" />
                <h3 className="text-white font-semibold text-sm">DECA Exam Tips</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Target, tip: 'Read all options before selecting — DECA often has "best" answers, not just "correct" ones.' },
                  { icon: BookOpen, tip: 'Focus on performance indicators in the DECA Guide — they map directly to exam questions.' },
                  { icon: Trophy, tip: 'Aim for 70%+ on cluster exams to qualify for ICDC at most chartered associations.' },
                  { icon: Zap, tip: 'Use Decademy.app for 40,000+ additional practice questions across all clusters.' },
                ].map(({ icon: Icon, tip }, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3">
                    <Icon size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-white/50 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-display text-base">D</div>
            <span className="text-white/60 text-sm">CHHS DECA © 2025–2026</span>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <a href="https://www.deca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">DECA.org</a>
            <a href="https://decademy.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Decademy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
