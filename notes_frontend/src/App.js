import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

/*
 * Color theme: primary (#1976d2), secondary (#757575), accent (#ffeb3b)
 * Modern, minimal, responsive app with sidebar and main content area.
 */

// Helper functions for localStorage note CRUD
const LS_KEY = "personal_notes_v1";
function getNotesFromStorage() {
  let data = localStorage.getItem(LS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}
function saveNotesToStorage(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}
// Generates a unique ID for new notes
function uuid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).replace(".", "").substr(0, 6)
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  // Notes state
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Input fields for new/edit note
  const [titleInput, setTitleInput] = useState("");
  const [bodyInput, setBodyInput] = useState("");

  // Load notes from localStorage on mount
  useEffect(() => {
    setNotes(getNotesFromStorage());
  }, []);

  // Persist notes on change
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Handle theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handler: Theme toggle
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Handler: Select note
  // PUBLIC_INTERFACE
  const handleSelectNote = (id) => {
    setSelectedId(id);
    setIsEditing(false);
    const note = notes.find((n) => n.id === id);
    if (note) {
      setTitleInput(note.title);
      setBodyInput(note.body);
    }
  };

  // Handler: New note
  // PUBLIC_INTERFACE
  const handleNewNote = () => {
    setSelectedId(null);
    setIsEditing(true);
    setTitleInput("");
    setBodyInput("");
  };

  // Handler: Save (create or update)
  // PUBLIC_INTERFACE
  const handleSaveNote = useCallback(() => {
    let nextNotes;
    if (selectedId) {
      nextNotes = notes.map((n) =>
        n.id === selectedId
          ? { ...n, title: titleInput, body: bodyInput, updated: Date.now() }
          : n
      );
    } else {
      const newNote = {
        id: uuid(),
        title: titleInput.trim() || "Untitled",
        body: bodyInput.trim(),
        created: Date.now(),
        updated: Date.now(),
      };
      nextNotes = [newNote, ...notes];
    }
    setNotes(nextNotes);
    setIsEditing(false);
    setSelectedId(selectedId || nextNotes[0]?.id || null);
  }, [selectedId, titleInput, bodyInput, notes]);

  // Handler: Delete note
  // PUBLIC_INTERFACE
  const handleDeleteNote = () => {
    if (!selectedId) return;
    const idx = notes.findIndex((n) => n.id === selectedId);
    const nextNotes = notes.filter((n) => n.id !== selectedId);
    setNotes(nextNotes);
    // Next selection logic: select next note after deleted, or previous, or none
    if (nextNotes.length === 0) {
      setSelectedId(null);
    } else if (idx < nextNotes.length) {
      setSelectedId(nextNotes[idx]?.id);
    } else if (idx > 0) {
      setSelectedId(nextNotes[idx - 1]?.id);
    } else {
      setSelectedId(nextNotes[0]?.id);
    }
    setIsEditing(false);
  };

  // Handler: Edit note
  // PUBLIC_INTERFACE
  const handleEditNote = () => {
    setIsEditing(true);
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setTitleInput(note.title);
      setBodyInput(note.body);
    }
  };

  // Handler: Cancel editing
  // PUBLIC_INTERFACE
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedId) {
      // restore fields
      const note = notes.find((n) => n.id === selectedId);
      setTitleInput(note?.title || "");
      setBodyInput(note?.body || "");
    } else {
      setTitleInput("");
      setBodyInput("");
    }
  };

  // Search: filter notes
  const filteredNotes = notes.filter((note) => {
    if (!search.trim()) return true;
    return (
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.body.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Determine selected note
  const selectedNote =
    notes.find((n) => n.id === selectedId) ||
    (filteredNotes.length > 0 && selectedId === null
      ? filteredNotes[0]
      : null);

  useEffect(() => {
    // On search/filter change, auto-select first found
    if (
      filteredNotes.length > 0 &&
      (!selectedNote || !filteredNotes.some((n) => n.id === selectedNote.id))
    ) {
      setSelectedId(filteredNotes[0].id);
    }
    if (filteredNotes.length === 0) {
      setSelectedId(null);
    }
    // eslint-disable-next-line
  }, [search, notes]);

  // Shortcuts for accessibility and productivity
  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      } else if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        const input = document.getElementById("search-input");
        if (input) input.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, []);

  // UI Components: Sidebar, Main Panel
  return (
    <div className="notes-app-root" data-theme={theme}>
      {/* Theme toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        style={{ position: "fixed", top: 18, right: 20, zIndex: 10 }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <div className="notes-flex-container">
        {/* Sidebar */}
        <aside className="sidebar" aria-label="All notes navigation">
          <header className="sidebar-header">
            <span
              className="sidebar-title"
              style={{
                color: "var(--primary)",
                fontWeight: "bold",
                fontSize: "2rem",
                letterSpacing: "0.02em",
                margin: "1.6rem 0 0.4rem 0",
                display: "inline-block",
              }}
            >
              <span style={{ color: "#ffeb3b" }}>✦</span> Notes
            </span>
            <button
              className="new-note-btn"
              title="New Note (Ctrl+N)"
              onClick={handleNewNote}
            >
              ＋
            </button>
          </header>
          <div className="sidebar-search">
            <input
              type="text"
              id="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
              className="search-input"
              autoComplete="off"
            />
          </div>
          <nav className="sidebar-list">
            {filteredNotes.length === 0 && (
              <div className="sidebar-empty">No notes found.</div>
            )}
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                className={`sidebar-note-btn ${
                  selectedId === note.id ? "active" : ""
                }`}
                onClick={() => handleSelectNote(note.id)}
                tabIndex={0}
                title={note.title}
                aria-current={selectedId === note.id}
              >
                <span
                  className="note-dot"
                  style={{
                    color: "#ffeb3b",
                    fontSize: "1.2rem",
                    marginRight: 7,
                  }}
                  aria-hidden="true"
                >
                  •
                </span>
                <span className="note-title-list">
                  {note.title.length > 20
                    ? note.title.substr(0, 20) + "…"
                    : note.title}
                </span>
                <span className="note-date">
                  {new Date(note.updated || note.created).toLocaleDateString()}
                </span>
              </button>
            ))}
          </nav>
        </aside>
        {/* Main panel */}
        <main className="main-panel" aria-label="Note details panel">
          {!isEditing && selectedNote && (
            <section className="note-details">
              <h2 className="note-details-title">{selectedNote.title}</h2>
              <div className="note-details-body">
                {selectedNote.body.split("\n").map((line, idx) => (
                  <p key={idx} style={{ margin: "0.35rem 0" }}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="note-details-actions">
                <button
                  className="edit-btn"
                  onClick={handleEditNote}
                  aria-label="Edit note"
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={handleDeleteNote}
                  aria-label="Delete note"
                  style={{ marginLeft: 9 }}
                >
                  Delete
                </button>
              </div>
              <div className="note-dates">
                <span>
                  Created:{" "}
                  {new Date(selectedNote.created).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span style={{ marginLeft: 16, opacity: 0.7 }}>
                  Updated:{" "}
                  {new Date(selectedNote.updated).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </section>
          )}
          {isEditing && (
            <section className="note-editor">
              <input
                className="note-title-input"
                type="text"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Title"
                maxLength={120}
              />
              <textarea
                className="note-body-input"
                value={bodyInput}
                onChange={(e) => setBodyInput(e.target.value)}
                placeholder="Write your note here..."
                rows={12}
                maxLength={5000}
                spellCheck={true}
              />
              <div className="note-editor-actions">
                <button
                  className="save-btn"
                  onClick={handleSaveNote}
                  aria-label="Save note"
                  disabled={titleInput.trim().length === 0}
                >
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={handleCancelEdit}
                  aria-label="Cancel editing"
                  style={{ marginLeft: 12 }}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
          {!isEditing && !selectedNote && (
            <section className="empty-main-hint">
              <h2>Welcome</h2>
              <p>
                Select a note on the left or{" "}
                <button
                  className="new-note-link"
                  onClick={handleNewNote}
                  aria-label="Create a new note"
                >
                  create a new note
                </button>
                .
              </p>
              <div className="app-footer">
                <span>
                  Personal Notes •{" "}
                  <span style={{ color: "#ffeb3b" }}>Modern React App</span>
                </span>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
