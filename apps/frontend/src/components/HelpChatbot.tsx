import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'

type Topic = 'search' | 'bookings' | 'profile'

type QA = { q: string; a: string }

const TOPICS: { id: Topic; label: string; icon: string }[] = [
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'bookings', label: 'Bookings', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

const QA_BY_TOPIC: Record<Topic, QA[]> = {
  search: [
    {
      q: 'How do I search for a host?',
      a: "Go to Search and filter by university, batch year, location, or travel dates. By default we only show alumni who are actively hosting - toggle \"Show only hosts\" off to browse the full alumni directory instead.",
    },
    {
      q: 'What does "Show only hosts" mean?',
      a: 'It filters results to alumni who currently have Host Mode turned on and are accepting booking requests. Turn it off to see every alumni profile, including people who aren\'t hosting right now.',
    },
    {
      q: 'How do dates and guest count affect results?',
      a: "Set your travel dates and guest count in the \"When\"/\"Who\" fields, and hosts who aren't available for those dates or can't fit your group won't show up in results.",
    },
  ],
  bookings: [
    {
      q: 'How do I request to stay with someone?',
      a: 'Click "Book" on a host\'s card, enter your travel dates and guest count, and send the request. The host gets notified and can approve or decline it from their Bookings page.',
    },
    {
      q: 'What happens after I send a request?',
      a: 'It shows as "Pending" until the host responds. If approved, you\'ll get an email with the host\'s contact info and it moves to "Upcoming". You can see all your outgoing requests under Bookings → Traveling.',
    },
    {
      q: 'Can multiple people request the same dates?',
      a: "Yes - a host can see every request for a given window and choose who to approve. If you're not chosen, your request is automatically declined the moment the host confirms someone else, and you'll get an email so you can find another host.",
    },
    {
      q: "Why can't I book someone?",
      a: 'Either they\'ve turned off Host Mode (shown as "Not Hosting" instead of a Book button), or your requested dates/guest count don\'t fit what they\'ve made available.',
    },
  ],
  profile: [
    {
      q: 'What does Host Mode do?',
      a: "Turning on Host Mode lets other alumni send you booking requests. Turn it off any time to stop receiving new requests - it won't affect stays you've already confirmed.",
    },
    {
      q: 'How do I set my availability?',
      a: 'In Profile, toggle "I\'m always available", or set specific Available From/To dates. Guests searching outside that window won\'t see you as an available host.',
    },
    {
      q: 'Why do I need to add my LinkedIn?',
      a: "It's required before you can send a booking request - it gives the host a way to verify who you are before agreeing to host you.",
    },
    {
      q: 'How do I delete my data or account?',
      a: 'Go to Settings, where you can request a copy of your data or request full account deletion at any time.',
    },
  ],
}

type Message =
  | { role: 'bot'; text: string }
  | { role: 'user'; text: string }

const GREETING = "Hi! I can explain how Search, Bookings, and Profile work here. What do you want to know?"

export default function HelpChatbot() {
  const location = useLocation()
  const [isAuthed, setIsAuthed] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: GREETING }])
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsAuthed(isAuthenticated())
  }, [location.pathname])

  // Keep the latest message in view - otherwise a new question/answer can land
  // below the fold behind the suggested-questions panel, forcing a manual scroll.
  useEffect(() => {
    if (open) transcriptEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, open])

  if (!isAuthed) return null

  const askQuestion = (topic: Topic, qa: QA) => {
    setMessages((prev) => [...prev, { role: 'user', text: qa.q }, { role: 'bot', text: qa.a }])
    setActiveTopic(topic)
  }

  const pickTopic = (topic: Topic) => {
    setActiveTopic(topic)
  }

  const backToTopics = () => setActiveTopic(null)

  return (
    <div className="fixed bottom-8 right-6 z-50">
      {open && (
        <div className="mb-3 w-[340px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden flex flex-col fade-in" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="bg-black px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="text-primary font-bold text-sm">Toast2Host Help</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === 'user'
                    ? 'bg-primary text-black font-medium rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Suggested topics / questions */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0 space-y-2 max-h-[45%] overflow-y-auto">
            {activeTopic === null ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Pick a topic</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickTopic(t.id)}
                      className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-black font-semibold text-sm px-3 py-1.5 rounded-full transition-colors"
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {TOPICS.find((t) => t.id === activeTopic)?.label} questions
                  </p>
                  <button type="button" onClick={backToTopics} className="text-xs font-semibold text-primary hover:underline">
                    &larr; Topics
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {QA_BY_TOPIC[activeTopic].map((qa) => (
                    <button
                      key={qa.q}
                      type="button"
                      onClick={() => askQuestion(activeTopic, qa)}
                      className="text-left text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      {qa.q}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Launcher button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-14 rounded-full bg-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 pl-4 pr-5 ring-4 ring-white"
        title="Help"
      >
        {open ? (
          <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.294 0-2.523-.245-3.632-.687L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        <span className="text-primary font-bold text-sm whitespace-nowrap">{open ? 'Close' : 'Help'}</span>
      </button>
    </div>
  )
}
