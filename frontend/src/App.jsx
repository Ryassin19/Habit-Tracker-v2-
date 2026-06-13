import { useState, useEffect } from 'react'
import './App.jsx'

function App() {
  const [habits, setHabits] = useState([])
  const [description, setDescription] = useState("")
  const [title, setTitle] = useState("")
  const [times_per_week, setTimes_per_week] = useState("")

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editTimesPerWeek, setEditTimesPerWeek] = useState("")

  const fetch_habits = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/habits/");
      if (response.ok) {
        const data = await response.json();
        setHabits(data); 
      }
    } catch (error) {
      console.error("Failed to fetch habits:", error);
    }
  };

  useEffect(() => {
    fetch_habits();
  }, []); 

  const send_data = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/habits/post`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          title: title,
          description: description,
          times_per_week: times_per_week
        })
      });

      if (response.ok) {
        console.log("Habit saved successfully!");
        setTitle("");
        setDescription("");
        setTimes_per_week(3);
        
        fetch_habits(); 
      }
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  const delete_habit = async (habitId, habitName) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/habits/${habitId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        console.log(`Habit ${habitName} deleted successfully!`);
        fetch_habits(); 
      }
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

 const save_edits = async (habitId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/habits/${habitId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          times_per_week: parseInt(editTimesPerWeek)
        })
      });

      if (response.ok) {
        console.log(`Habit ${habitId} updated successfully!`);
        setEditingId(null); 
        fetch_habits(); 
      }
    } catch (error) {
      console.error("Failed to update habit:", error);
    }
  };

  

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🎯 My Habit Tracker</h1>
      
      {/* 📝 FORM SECTION */}
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px', color: '#333' }}>
        <h3>Create a New Habit</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Habit Title:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., Learn React"
            style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Description:</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g., Code for 30 minutes"
            style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Times Per Week:</label>
          <input 
            type="number" 
            value={times_per_week} 
            onChange={(e) => setTimes_per_week(parseInt(e.target.value) || "")}
            placeholder="e.g., 3"
            min="1"
            max="7" 
            style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          onClick={send_data}
          style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add Habit
        </button>
      </div>

      <hr />

      {/* 📋 HABITS DISPLAY SECTION */}
      <div>
        <h3>My Habits</h3>
        {habits.length === 0 ? (
          <p style={{ color: '#666' }}>No habits found. Add one above!</p>
        ) : (
          habits.map((habit) => {
            // CONDITION A: If editing this habit, show text boxes
            if (editingId === habit.id) {
              return (
                <div key={habit.id} style={{ border: '2px solid #007bff', padding: '15px', borderRadius: '4px', marginBottom: '10px', background: '#222' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>✏️ Editing Habit</h4>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="text" 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="number" 
                    value={editTimesPerWeek} 
                    onChange={(e) => setEditTimesPerWeek(e.target.value)} 
                    min="1"
                    max="7"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-evenly' }}>
                    <button onClick={() => save_edits(habit.id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )
            }

            // CONDITION B: Default view mode
            return (
              <div key={habit.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', marginBottom: '10px' }}>
                <h4>{habit.title}</h4>
                <p>{habit.description}</p>
                <p>🎯 {habit.times_per_week} times per week</p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'space-evenly' }}>
                  <button 
                    onClick={() => {
                      setEditingId(habit.id);
                      setEditTitle(habit.title);
                      setEditDescription(habit.description);
                      setEditTimesPerWeek(habit.times_per_week);
                    }}
                    style={{ background: '#ffc107', color: 'black', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => delete_habit(habit.id)}
                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default App


