import { useState, useEffect } from 'react'
import './index.css'
import Login from './Login'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const [habits, setHabits] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timesPerWeek, setTimesPerWeek] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTimesPerWeek, setEditTimesPerWeek] = useState('')

  const [aiHeadline, setAiHeadline] = useState('')
  const [aiChallenges, setAiChallenges] = useState([])
  const [completed, setCompleted] = useState({})
  const [loadingAi, setLoadingAi] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) setIsAuthenticated(true)
    setLoading(false)
  }, [])

  const token = () => localStorage.getItem('token')

  const fetchHabits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/`, {
        headers: { Authorization: `Bearer ${token()}` }
      })
      if (res.ok) setHabits(await res.json())
      else if (res.status === 401) handleLogout()
    } catch (e) { console.error(e) }
  }

  useEffect(() => { if (isAuthenticated) fetchHabits() }, [isAuthenticated])

  const addHabit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, times_per_week: timesPerWeek })
      })
      if (res.ok) { setTitle(''); setDescription(''); setTimesPerWeek(''); fetchHabits() }
    } catch (e) { console.error(e) }
  }

  const deleteHabit = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      })
      if (res.ok) fetchHabits()
    } catch (e) { console.error(e) }
  }

  const saveEdits = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription, times_per_week: parseInt(editTimesPerWeek) })
      })
      if (res.ok) { setEditingId(null); fetchHabits() }
    } catch (e) { console.error(e) }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setHabits([])
    setAiChallenges("")
  }

  const askAiCoach = async () => {
    setLoadingAi(true); setAiHeadline(''); setAiChallenges([]); setCompleted({})
    try {
      const res = await fetch(`${API_BASE_URL}/habits/ai-coach`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }
      })
      if (res.ok) { const d = await res.json(); setAiHeadline(d.headline); setAiChallenges(d.challenges || []) }
    } catch (e) { setAiHeadline('Coach unavailable — try again shortly.') }
    finally { setLoadingAi(false) }
  }

  const toggle = (i) => setCompleted(p => ({ ...p, [i]: !p[i] }))

  const startEdit = (habit) => {
    setEditingId(habit.id)
    setEditTitle(habit.title)
    setEditDescription(habit.description)
    setEditTimesPerWeek(habit.times_per_week)
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />

  return (
    <div className="app">

      <header className="app-header">
        <h1>Habit tracker</h1>
        <button className="btn-signout" onClick={handleLogout}>Sign out</button>
      </header>

      <div className="section-label"><h2>New habit</h2></div>
      <div className="card">
        <div className="field">
          <label htmlFor="f-title">Title</label>
          <input id="f-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning run" />
        </div>
        <div className="field">
          <label htmlFor="f-desc">Description</label>
          <input id="f-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 20 minutes before breakfast" />
        </div>
        <div className="field">
          <label htmlFor="f-freq">Times per week</label>
          <input id="f-freq" type="number" value={timesPerWeek} onChange={e => setTimesPerWeek(parseInt(e.target.value) || '')} placeholder="1–7" min="1" max="7" />
        </div>
        <button className="btn btn-primary" onClick={addHabit}>Add habit</button>
      </div>

      <div className="section-label"><h2>AI coach</h2></div>
      <div className="ai-card">
        <div className="ai-card-top">
          <div className="ai-eyebrow">Weekly quests</div>
          <h3>Personalised challenges</h3>
          <p>Three custom missions generated from your habit patterns.</p>
        </div>
        <div className="ai-card-action">
          <button className="btn btn-primary btn-full" onClick={askAiCoach} disabled={loadingAi}>
            {loadingAi ? 'Generating…' : 'Generate this week\'s quests'}
          </button>
        </div>
        {aiHeadline && (
          <div className="ai-results">
            <p className="ai-headline">{aiHeadline}</p>
            <div className="quest-list">
              {Array.isArray(aiChallenges) ? (
                aiChallenges.map((c, i) => (
                  <div key={i} className={`quest-item${completed[i] ? ' done' : ''}`} onClick={() => toggle(i)}>
                    <input 
                      type="checkbox" 
                      checked={!!completed[i]} 
                      onChange={() => toggle(i)} 
                      onClick={e => e.stopPropagation()} 
                    />
                    <div className="quest-item-label">
                      {typeof c === 'object' && c !== null ? (
                        <>
                          <strong>{c.title || c.description}</strong>
                          {c.title && c.description && ` — ${c.description}`}
                        </>
                      ) : (
                        <strong>{c}</strong>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No active challenges. Click above to generate quests!</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="section-label" style={{ marginTop: 8 }}><h2>My habits</h2></div>

      {habits.length === 0 ? (
        <div className="empty">
          <p>No habits yet.</p>
          <p>Add one above to get started.</p>
        </div>
      ) : (
        <div className="habit-list">
          {habits.map(habit => {
            if (editingId === habit.id) return (
              <div key={habit.id} className="habit-edit">
                <div className="habit-edit-label">Editing</div>
                <div className="field">
                  <label>Title</label>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label>Description</label>
                  <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                </div>
                <div className="field">
                  <label>Times per week</label>
                  <input type="number" value={editTimesPerWeek} onChange={e => setEditTimesPerWeek(e.target.value)} min="1" max="7" />
                </div>
                <div className="edit-actions">
                  <button className="btn btn-primary" onClick={() => saveEdits(habit.id)}>Save</button>
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )

            return (
              <div key={habit.id} className="habit-row">
                <div className="habit-row-meta">
                  <h4>{habit.title}</h4>
                  <p>{habit.description}</p>
                  <span className="habit-freq">{habit.times_per_week}× per week</span>
                </div>
                <div className="habit-row-actions">
                  <button className="btn btn-edit" onClick={() => startEdit(habit)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteHabit(habit.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

export default App