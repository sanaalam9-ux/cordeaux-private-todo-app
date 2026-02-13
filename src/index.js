import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nlekfyjrfuyzzoceplse.supabase.co', 
  'sb_publishable_Oss88I_9zVugGXNE3Yuqng_dvTlog2E'
);

const CAT_COLORS = { Personal: '#4c51bf', Work: '#ed8936', Urgent: '#e53e3e', Other: '#718096' };

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // EXPANDED EDITING STATES
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('Personal');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchTodos();
  }, [user]);

  async function fetchTodos() {
    const { data } = await supabase.from('todos').select().order('id', { ascending: false });
    setTodos(data || []);
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setTodos([]);
  }

  async function addTodo() {
    if (newTask.trim().length > 0) {
      await supabase.from('todos').insert([{ 
        task: newTask, 
        category, 
        due_date: dueDate || null 
      }]);
      setNewTask(''); 
      setDueDate('');
      fetchTodos();   
    }
  }

  async function toggleDone(id, currentStatus) {
    await supabase.from('todos').update({ is_done: !currentStatus }).eq('id', id);
    fetchTodos(); 
  }

  async function deleteTodo(id) {
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos();
  }

  // UPDATED: SAVE TEXT, CATEGORY, AND DATE
  async function saveEdit(id) {
    if (editText.trim().length > 0) {
      await supabase.from('todos').update({ 
        task: editText,
        category: editCategory,
        due_date: editDate || null
      }).eq('id', id);
      setEditingId(null);
      fetchTodos();
    }
  }

  const filteredTodos = todos.filter(todo => {
    const matchesFilter = activeFilter === 'All' || todo.category === activeFilter;
    const matchesSearch = todo.task.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const theme = {
    bg: isDarkMode ? '#1a202c' : '#f0f2f5',
    card: isDarkMode ? '#2d3748' : 'white',
    text: isDarkMode ? '#f7fafc' : '#1a202c',
    subtext: isDarkMode ? '#a0aec0' : '#718096',
    border: isDarkMode ? '#4a5568' : '#edf2f7',
    inputBg: isDarkMode ? '#1a202c' : '#f8fafc'
  };

  if (!user) {
    return (
      <div style={{...styles.container, backgroundColor: theme.bg}}>
        <div style={{...styles.card, backgroundColor: theme.card}}>
          <h1 style={{...styles.title, color: theme.text, textAlign: 'center'}}>Welcome</h1>
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={{...styles.input, marginTop: '10px'}} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button onClick={handleLogin} style={styles.addButton}>Login</button>
            <button onClick={handleSignUp} style={{...styles.addButton, backgroundColor: '#718096'}}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, backgroundColor: theme.bg}}>
      <div style={{...styles.card, backgroundColor: theme.card}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h1 style={{...styles.title, color: theme.text}}>My Tasks</h1>
           <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             <button onClick={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>{isDarkMode ? '☀️' : '🌙'}</button>
             <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
           </div>
        </div>
        
        <input 
          type="text" 
          placeholder="🔍 Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{...styles.searchInput, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border}}
        />

        <div style={styles.filterBar}>
          {['All', 'Personal', 'Work', 'Urgent'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              ...styles.filterBtn,
              backgroundColor: activeFilter === f ? '#4c51bf' : 'transparent',
              color: activeFilter === f ? 'white' : theme.subtext,
              borderColor: activeFilter === f ? '#4c51bf' : theme.border
            }}>{f}</button>
          ))}
        </div>

        {/* CREATE SECTION */}
        <div style={{...styles.inputContainer, backgroundColor: theme.inputBg}}>
          <input 
            type="text" 
            placeholder="New task name..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            style={{...styles.input, border: `1px solid ${theme.border}`}}
          />
          <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{...styles.select, border: `1px solid ${theme.border}`}}>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Urgent">Urgent</option>
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{...styles.select, border: `1px solid ${theme.border}`, flex: 1.5}} />
            <button onClick={addTodo} style={styles.addButton}>Add</button>
          </div>
        </div>

        {/* LIST SECTION */}
        <div style={styles.listContainer}>
          {filteredTodos.map((item) => (
            <div key={item.id} style={{...styles.todoItem, backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'column', alignItems: 'stretch'}}>
              
              {editingId === item.id ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <input 
                    style={{...styles.input, border: `1px solid ${theme.border}`}} 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div style={{display: 'flex', gap: '5px'}}>
                    <select 
                      value={editCategory} 
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{...styles.select, border: `1px solid ${theme.border}`, flex: 1}}
                    >
                      <option value="Personal">Personal</option>
                      <option value="Work">Work</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    <input 
                      type="date" 
                      value={editDate} 
                      onChange={(e) => setEditDate(e.target.value)}
                      style={{...styles.select, border: `1px solid ${theme.border}`, flex: 1.5}}
                    />
                  </div>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => saveEdit(item.id)} style={{...styles.addButton, flex: 1}}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{...styles.addButton, backgroundColor: '#718096', flex: 1}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div onClick={() => toggleDone(item.id, item.is_done)} style={styles.todoText}>
                    <div style={{...styles.checkbox, backgroundColor: item.is_done ? '#48bb78' : 'transparent', borderColor: item.is_done ? '#48bb78' : '#cbd5e0'}}>
                      {item.is_done && '✓'}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{ textDecoration: item.is_done ? 'line-through' : 'none', color: item.is_done ? theme.subtext : theme.text, fontSize: '16px', fontWeight: '500' }}>
                        {item.task}
                      </div>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px'}}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white', backgroundColor: CAT_COLORS[item.category] || '#718096', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {item.category}
                        </span>
                        {item.due_date && <span style={{ fontSize: '11px', color: theme.subtext }}>📅 {item.due_date}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => { 
                      setEditingId(item.id); 
                      setEditText(item.task); 
                      setEditCategory(item.category || 'Personal');
                      setEditDate(item.due_date || '');
                    }} style={styles.actionBtn}>✏️</button>
                    <button onClick={() => deleteTodo(item.id)} style={styles.actionBtn}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '40px', paddingBottom: '40px', fontFamily: 'system-ui, sans-serif' },
  card: { width: '100%', maxWidth: '450px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '30px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '800' },
  searchInput: { width: '100%', padding: '12px', fontSize: '14px', borderRadius: '12px', marginTop: '15px', outline: 'none', border: '1px solid' },
  filterBar: { display: 'flex', gap: '8px', margin: '15px 0', overflowX: 'auto' },
  filterBtn: { padding: '6px 12px', borderRadius: '20px', border: '1px solid', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
  inputContainer: { marginBottom: '20px', padding: '15px', borderRadius: '16px' },
  input: { width: '100%', padding: '10px', fontSize: '15px', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
  select: { padding: '8px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  addButton: { padding: '10px 20px', backgroundColor: '#4c51bf', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  todoItem: { display: 'flex', padding: '14px', borderRadius: '12px', border: '1px solid' },
  todoText: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 },
  checkbox: { width: '20px', height: '20px', borderRadius: '6px', border: '2px solid', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' },
  actionBtn: { background: 'none', border: 'none', color: '#cbd5e0', fontSize: '14px', cursor: 'pointer', padding: '5px' },
  logoutBtn: { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '12px' },
  themeToggle: { fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }
};

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode><App /></StrictMode>);
