import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>SceneScribe</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <div id="app">
        <header className="topbar">
          <div className="topbar-left">
            <div className="menu-wrapper">
              <button
                className="menu-button"
                id="menuButton"
                onClick={() => toggleMenu()}
                aria-label="Open menu"
                title="Menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              <div id="menuDropdown" className="menu-dropdown">
                <button onClick={() => goToDashboard()}>Dashboard</button>
                <button onClick={() => openUploadsPage()}>Uploads</button>
                <button onClick={() => openFoldersPage()}>Folders</button>
                <button onClick={() => openSettingsPage()}>Settings</button>
              </div>
            </div>
          </div>

          <div className="topbar-center">
            <div className="brand">
              <div className="logo">S</div>
              <div className="name">SceneScribe</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="profile-button" aria-label="Profile" title="Profile">
              <svg viewBox="0 0 24 24" className="profile-icon" aria-hidden="true">
                <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12Zm0 2c-4.418 0-8 2.91-8 6.5 0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5 0-3.59-3.582-6.5-8-6.5Z"/>
              </svg>
            </button>
          </div>
        </header>

        <main className="container">
          <section className="left-column">
            <div className="video-card">
              <div className="video-shell">
                <video id="video" controls autoPlay muted loop>
                  <source
                    src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="video-info">
                <div className="video-info-left">
                  <div className="video-label">Now Playing</div>
                  <div id="videoTitle" className="video-title">Flower Demo</div>
                </div>

                <div className="video-info-right">
                  <div className="video-label right-label">Length</div>
                  <div id="videoLength" className="video-length">0:00:00</div>
                </div>
              </div>

              <input id="videoUpload" type="file" accept="video/*" />
            </div>

            <div className="info-card">
              <div className="section-header">
                <h3>Summary</h3>
                <button
                  id="summaryActionButton"
                  className="icon-button action-mini-button"
                  onClick={() => handleSummaryAction()}
                  aria-label="Generate summary"
                  title="Generate summary"
                >
                  +
                </button>
              </div>

              <div className="compact-content-box">
                <div id="summary" className="generated-text">No summary yet.</div>
              </div>
            </div>

            <div className="info-card">
              <div className="section-header">
                <h3>Key Takeaways</h3>
                <button
                  id="takeawaysActionButton"
                  className="icon-button action-mini-button"
                  onClick={() => handleTakeawaysAction()}
                  aria-label="Generate takeaways"
                  title="Generate takeaways"
                >
                  +
                </button>
              </div>

              <div className="compact-content-box">
                <div id="takeaways" className="generated-text">No takeaways yet.</div>
              </div>
            </div>
          </section>

          <section className="right-column">
            <div className="main-card">
              <div className="tabs-header">
                <div className="tabs">
                  <button className="tab-button active" onClick={(e) => switchTab('transcript', e.target)}>Transcript</button>
                  <button className="tab-button" onClick={(e) => switchTab('notes', e.target)}>Notes</button>
                  <button className="tab-button" onClick={(e) => switchTab('comments', e.target)}>Comments</button>
                  <button className="tab-button" onClick={(e) => switchTab('ai', e.target)}>AI Chat</button>
                  <button className="tab-button" onClick={(e) => switchTab('quiz', e.target)}>Quiz</button>
                </div>
              </div>

              <div id="transcriptTab" className="tab-content active">
                <div className="tab-tools-row">
                  <button id="exportTranscriptButton" className="export-button" onClick={() => exportTranscript()}>
                    <svg viewBox="0 0 24 24" className="export-icon" aria-hidden="true">
                      <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"/>
                    </svg>
                    <span>Export Transcript</span>
                  </button>

                  <div className="content-actions">
                    <button className="square-action-button" onClick={() => shareTranscript()} aria-label="Share" title="Share">
                      <svg viewBox="0 0 24 24" className="square-action-icon" aria-hidden="true">
                        <path d="M18 16a2.98 2.98 0 0 0-2.24 1.02l-6.31-3.5a3.1 3.1 0 0 0 0-1.04l6.31-3.5A3 3 0 1 0 15 7a3.1 3.1 0 0 0 .04.5l-6.31 3.5a3 3 0 1 0 0 1.99l6.31 3.5A3 3 0 1 0 18 16Z"/>
                      </svg>
                    </button>

                    <div className="more-menu-wrapper">
                      <button
                        className="square-action-button"
                        onClick={() => toggleTranscriptMoreMenu()}
                        aria-label="More"
                        title="More"
                      >
                        <svg viewBox="0 0 24 24" className="square-action-icon" aria-hidden="true">
                          <path d="M6 10.5A1.5 1.5 0 1 1 6 13.5 1.5 1.5 0 0 1 6 10.5Zm6 0A1.5 1.5 0 1 1 12 13.5 1.5 1.5 0 0 1 12 10.5Zm6 0A1.5 1.5 0 1 1 18 13.5 1.5 1.5 0 0 1 18 10.5Z"/>
                        </svg>
                      </button>

                      <div id="transcriptMoreMenu" className="transcript-more-menu">
                        <button onClick={() => retranscribeFile()}>Retranscribe</button>
                        <button onClick={() => renameTranscript()}>Rename</button>
                        <button onClick={() => moveTranscript()}>Move</button>
                        <hr />
                        <button className="danger-item" onClick={() => deleteOriginalFile()}>Delete Original File</button>
                        <button className="danger-item" onClick={() => deleteTranscript()}>Delete Transcript</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="transcriptScroll" className="transcript-scroll"></div>
              </div>

              <div id="notesTab" className="tab-content">
                <div className="notes-panel">
                  <textarea
                    id="noteDocInput"
                    className="notes-textarea"
                    placeholder="Start writing your notes here..."
                  ></textarea>

                  <div className="notes-save-bar">
                    <button id="saveNotesButton" className="primary-button" onClick={() => saveNoteDoc()}>
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div id="commentsTab" className="tab-content">
                <div className="comments-panel">
                  <div className="comments-top-inside">
                    <div id="commentsTimeLabel" className="time-pill">0:00:00</div>
                  </div>

                  <div id="commentsList" className="message-scroll compact-message-scroll">
                    <div className="empty-state">No comments yet.</div>
                  </div>

                  <div className="input-area">
                    <div className="input-wrap">
                      <textarea
                        id="commentInput"
                        placeholder="Write a comment at this timestamp..."
                      ></textarea>
                      <button className="primary-button inside-button" onClick={() => addComment()}>Add</button>
                    </div>
                  </div>
                </div>
              </div>

              <div id="aiTab" className="tab-content">
                <p className="subtext">Ask questions about the video, transcript, notes, or comments.</p>

                <div className="ai-layout">
                  <div id="aiMessages" className="message-scroll compact-message-scroll">
                    <div className="empty-state">No questions yet.</div>
                  </div>

                  <div className="input-area">
                    <div className="input-wrap ai-input-wrap">
                      <textarea
                        id="aiInput"
                        placeholder="Ask anything..."
                      ></textarea>

                      <div className="ai-actions">
                        <button className="primary-button small-pill" onClick={() => askAI()}>Send</button>
                        <button
                          id="aiActionButton"
                          className="icon-button action-mini-button"
                          onClick={() => handleAIAction()}
                          aria-label="Generate AI response"
                          title="Generate AI response"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="quizTab" className="tab-content">
                <div className="tab-tools-row quiz-tools-row">
                  <button className="primary-button" onClick={() => generateQuiz()}>Generate Quiz</button>
                </div>

                <div className="quiz-layout">
                  <div id="quizContainer" className="quiz-flat">
                    <div className="empty-state">No quiz yet.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <label htmlFor="videoUpload" className="floating-upload-button">
          Upload New
        </label>
      </div>
      <script src="/script.js"></script>
    </>
  );
}