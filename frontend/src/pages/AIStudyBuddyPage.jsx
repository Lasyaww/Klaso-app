import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot, Send, Sparkles, BookOpen, Award, AlertCircle, Trash2,
  HelpCircle, RefreshCw, FileText, CheckCircle2, ArrowRight,
  Paperclip, Image, X, Activity, Zap, PlayCircle
} from 'lucide-react';
import { QuizModal } from '../components/QuizModal';
import api from '../services/api';

export const AIStudyBuddyPage = () => {
  const location = useLocation();
  const missedClassFromState = location.state?.missedClass;

  const [activeTab, setActiveTab] = useState(missedClassFromState ? 'missed' : 'chat');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hi there! 👋 I'm your Klaso AI Study Buddy. How can I help you with your studies today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Summarizer state
  const [summaryData, setSummaryData] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryFile, setSummaryFile] = useState(null);

  // Quiz state
  const [quizTopic, setQuizTopic] = useState('Trees & Graphs');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Missed class recap state
  const [missedRecap, setMissedRecap] = useState(null);

  // Learning Pulse state
  const [pulseData, setPulseData] = useState(null);
  const [loadingPulse, setLoadingPulse] = useState(false);

  // Quick Revision state
  const [revisionMode, setRevisionMode] = useState('5-min');
  const [revisionCards, setRevisionCards] = useState(null);
  const [generatingRevision, setGeneratingRevision] = useState(false);
  const [revisionTopics, setRevisionTopics] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (missedClassFromState) {
      api.post('/ai/missed-class', { attendance_id: missedClassFromState.attendance_id })
        .then((res) => setMissedRecap(res))
        .catch((err) => console.error(err));
    }
  }, [missedClassFromState]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !uploadedFile && !uploadedImage) || loading) return;

    const userMsg = inputText.trim();
    setInputText('');
    
    // Add user message to UI
    let displayMsg = userMsg;
    if (uploadedFile) displayMsg = `[Attached File: ${uploadedFile.name}]\n${userMsg}`;
    if (uploadedImage) displayMsg = `[Attached Image: ${uploadedImage.name}]\n${userMsg}`;
    if (!userMsg) displayMsg = displayMsg.replace('\n', ''); // If no text, just show attachment name

    setMessages(prev => [...prev, { sender: 'user', text: displayMsg }]);
    setLoading(true);

    const formData = new FormData();
    formData.append('message', userMsg || "Explain the attached document.");
    if (uploadedFile) formData.append('file', uploadedFile);
    if (uploadedImage) formData.append('image', uploadedImage);

    // Clear attachments after adding to form data
    removeAttachment();

    api.post('/ai/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        setMessages(prev => [...prev, { sender: 'ai', text: res.reply, isRefusal: res.is_refusal }]);
      })
      .catch((err) => {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Something went wrong. Please check your network connection.' }]);
      })
      .finally(() => setLoading(false));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Please upload a file smaller than 10MB.");
        return;
      }
      removeAttachment();
      setUploadedFile(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Please upload an image smaller than 5MB.");
        return;
      }
      removeAttachment();
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeAttachment = () => {
    setUploadedFile(null);
    setUploadedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSummarizeNotes = () => {
    if (!summaryFile) {
      alert("Please upload a PDF file first.");
      return;
    }
    setSummarizing(true);
    const formData = new FormData();
    formData.append('file', summaryFile);
    
    api.post('/ai/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => setSummaryData(res))
      .catch((err) => console.error(err))
      .finally(() => setSummarizing(false));
  };

  const handleGenerateQuiz = () => {
    setGeneratingQuiz(true);
    api.post('/ai/generate-quiz', {
      subject_id: 1,
      topic: quizTopic,
      difficulty: quizDifficulty,
      num_questions: 5
    })
      .then((res) => {
        setActiveQuiz(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setGeneratingQuiz(false));
  };

  const fetchLearningPulse = () => {
    setLoadingPulse(true);
    api.get('/ai/pulse')
      .then(res => setPulseData(res))
      .catch(err => console.error(err))
      .finally(() => setLoadingPulse(false));
  };

  const handleGenerateRevision = () => {
    setGeneratingRevision(true);
    api.post('/ai/quick-revision', { mode: revisionMode })
      .then(res => {
        setRevisionCards(res.cards);
        setRevisionTopics(res.topics);
      })
      .catch(err => console.error(err))
      .finally(() => setGeneratingRevision(false));
  };

  useEffect(() => {
    if (activeTab === 'pulse' && !pulseData) {
      fetchLearningPulse();
    }
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 110px)' }}>
      {/* Header */}
      <div className="card glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
        color: 'white',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>AI Study Buddy 🤖</h2>
            <p style={{ fontSize: '0.88rem', color: '#e0f2fe' }}>
              Your personal academic companion. Focused 100% on your studies, notes & exams.
            </p>
          </div>
        </div>

        {/* Feature Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'chat' ? 'white' : 'transparent',
              color: activeTab === 'chat' ? '#0284c7' : 'white'
            }}
          >
            💬 Academic Chat
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'summary' ? 'white' : 'transparent',
              color: activeTab === 'summary' ? '#0284c7' : 'white'
            }}
          >
            ✨ Note Summarizer
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'quiz' ? 'white' : 'transparent',
              color: activeTab === 'quiz' ? '#0284c7' : 'white'
            }}
          >
            🧠 Quiz Generator
          </button>
          <button
            onClick={() => setActiveTab('pulse')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'pulse' ? 'white' : 'transparent',
              color: activeTab === 'pulse' ? '#0284c7' : 'white'
            }}
          >
            📈 Learning Pulse
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'revision' ? 'white' : 'transparent',
              color: activeTab === 'revision' ? '#0284c7' : 'white'
            }}
          >
            ⚡ Quick Revision
          </button>
          {missedClassFromState && (
            <button
              onClick={() => setActiveTab('missed')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: activeTab === 'missed' ? '#ef4444' : 'transparent',
                color: 'white'
              }}
            >
              🔴 Missed Class Help
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'chat' && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Preset Prompts */}
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              {(uploadedFile || uploadedImage) ? 'Quick Document Actions:' : 'Quick Doubts:'}
            </span>
            {((uploadedFile || uploadedImage) ? [
              "🧠 Explain Simply",
              "📝 Summarize",
              "📚 Make Study Notes",
              "❓ Ask Questions",
              "🎯 Create Quiz"
            ] : [
              "Explain recursion like I'm a beginner",
              "What is normalization in DBMS?",
              "Summarize B-Trees vs AVL Trees",
              "Give me exam tips for Data Structures"
            ]).map((p, i) => (
              <button
                key={i}
                onClick={() => setInputText(p)}
                style={{
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  color: '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                💡 {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: m.sender === 'user' ? 'var(--primary)' : m.isRefusal ? '#fff1f1' : '#f1f5f9',
                  color: m.sender === 'user' ? 'white' : m.isRefusal ? '#991b1b' : '#0f172a',
                  border: m.isRefusal ? '1px solid #fca5a5' : 'none',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', color: '#0284c7', fontSize: '0.85rem', fontWeight: 600, padding: '8px' }}>
                <Bot size={18} className="animate-spin" /> AI Study Buddy is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form with Upload Preview */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', background: 'white', display: 'flex', flexDirection: 'column' }}>
            
            {/* Attachment Preview Area */}
            {(uploadedFile || uploadedImage) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                {uploadedImage && previewUrl ? (
                  <img src={previewUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    <FileText size={24} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uploadedFile?.name || uploadedImage?.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Attached</span>
                </div>
                <button type="button" onClick={removeAttachment} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt,.csv,.pptx" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={imageInputRef} 
                onChange={handleImageChange} 
              />
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()} 
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
                  title="Upload Document"
                >
                  <Paperclip size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current.click()} 
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
                  title="Upload Photo"
                >
                  <Image size={18} />
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Ask an academic question or attach a file..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '0 24px', height: '44px' }}>
                <Send size={18} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Note Summarizer Tab */}
      {activeTab === 'summary' && (
        <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>✨ AI Note Summarizer & Exam Revision Mode</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>Upload a PDF of your class notes to extract key definitions, concepts, and exam revision points.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setSummaryFile(e.target.files[0])}
                  style={{ fontSize: '0.9rem' }}
                />
                <button className="btn btn-ai" onClick={handleSummarizeNotes} disabled={summarizing || !summaryFile}>
                  {summarizing ? 'Generating Summary...' : '✨ Summarize PDF Notes'}
                </button>
              </div>
            </div>
          </div>

          {summaryData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: '#065f46', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Quick Summary</h4>
                <p style={{ color: '#047857', fontSize: '0.92rem' }}>{summaryData.quick_summary}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>📌 Important Concepts</h4>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summaryData.important_concepts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>

                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                  <h4 style={{ color: '#92400e', fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>💡 Exam Points to Revise</h4>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summaryData.exam_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: 'var(--radius-md)', color: '#1e40af', fontSize: '0.9rem' }}>
                <strong>🚀 Quick Revision:</strong> {summaryData.quick_revision}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Click <strong>"Summarize Class Notes"</strong> to process your uploaded course notes into structured exam revision guides.
            </div>
          )}
        </div>
      )}

      {/* AI Quiz Generator Tab */}
      {activeTab === 'quiz' && (
        <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>🧠 AI Quiz & MCQ Generator</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>Generate customized multiple-choice practice tests based on your lecture topics.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label>Topic / Subject</label>
              <input
                type="text"
                className="form-control"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select className="form-control" value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ai" onClick={handleGenerateQuiz} disabled={generatingQuiz} style={{ marginTop: '22px' }}>
                {generatingQuiz ? 'Generating Questions...' : '🎯 Generate AI Quiz'}
              </button>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Today's Learning Check 🧠</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '14px' }}>
              Test your understanding of today's Data Structures lecture on Trees and Graphs.
            </p>
            <button className="btn btn-primary" onClick={handleGenerateQuiz}>
              Take 5-Question Learning Check
            </button>
          </div>
        </div>
      )}

      {/* Missed Class Help Tab */}
      {activeTab === 'missed' && (
        <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {missedRecap ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ color: '#991b1b', fontSize: '1.1rem', fontWeight: 700 }}>
                  🔴 Missed Class Assistance: {missedRecap.missed_class.subject_name}
                </h3>
                <p style={{ color: '#7f1d1d', fontSize: '0.88rem', marginTop: '2px' }}>
                  Faculty: {missedRecap.missed_class.faculty_name} | Date: {missedRecap.missed_class.date}
                </p>
              </div>

              <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
                {missedRecap.ai_recap}
              </div>

              <button className="btn btn-ai" onClick={() => setActiveQuiz(missedRecap.quiz)}>
                🧠 Take Quick 3-Question Quiz for Missed Lecture
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Loading missed lecture recap...
            </div>
          )}
        </div>
      )}

      {/* Learning Pulse Tab */}
      {activeTab === 'pulse' && (
        <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="#0284c7" /> Your Learning Pulse
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
            Track your strengths and identify topics that need a little more practice based on your AI quizzes.
          </p>

          {loadingPulse ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <RefreshCw className="animate-spin" style={{ margin: '0 auto 10px' }} />
              Loading your learning profile...
            </div>
          ) : pulseData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Subject Progress */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px' }}>Subject Mastery</h4>
                {pulseData.subjects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pulseData.subjects.map((subj, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{subj.subject_name}</span>
                          <span style={{ color: '#64748b' }}>{subj.progress_percentage}% Mastery</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                          <div style={{
                            width: `${subj.progress_percentage}%`,
                            height: '100%',
                            background: subj.progress_percentage >= 75 ? '#10b981' : subj.progress_percentage >= 50 ? '#f59e0b' : '#ef4444',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                    No learning data yet. Start taking AI quizzes to build your learning profile!
                  </div>
                )}
              </div>

              {/* Weak Topics */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={18} color="#f59e0b" /> Topics to Review
                </h4>
                {pulseData.topics_to_review.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {pulseData.topics_to_review.map((topic, i) => (
                      <div key={i} style={{ 
                        background: '#fff', 
                        border: '1px solid var(--border-light)', 
                        padding: '16px', 
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                            {topic.subject_name}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                            {topic.topic_name}
                          </div>
                          <div style={{ 
                            display: 'inline-block',
                            marginTop: '6px',
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            background: topic.status.includes('Strong') ? '#d1fae5' : topic.status.includes('Attention') ? '#fee2e2' : '#fef3c7',
                            color: topic.status.includes('Strong') ? '#065f46' : topic.status.includes('Attention') ? '#991b1b' : '#92400e'
                          }}>
                            {topic.status} (Score: {topic.weakness_score}/100)
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" onClick={() => {
                            setQuizTopic(topic.topic_name);
                            setActiveTab('quiz');
                          }}>
                            Practice Questions
                          </button>
                          <button className="btn btn-ai" onClick={() => {
                            setRevisionMode('2-min');
                            setActiveTab('revision');
                          }}>
                            Quick Revision
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                    No weak topics identified yet. Keep up the good work!
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      )}

      {/* Quick Revision Tab */}
      {activeTab === 'revision' && (
        <div className="card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap color="#eab308" /> Smart Quick Revision
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
            Get personalized bite-sized revision cards prioritizing topics you've struggled with recently.
          </p>

          {!revisionCards ? (
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                {['2-min', '5-min', '10-min'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setRevisionMode(mode)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-md)',
                      border: revisionMode === mode ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                      background: revisionMode === mode ? '#eff6ff' : 'white',
                      fontWeight: 600,
                      color: revisionMode === mode ? 'var(--primary)' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {mode === '2-min' ? '⚡' : mode === '5-min' ? '📚' : '🔥'} {mode}
                  </button>
                ))}
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateRevision} 
                disabled={generatingRevision}
                style={{ padding: '12px 32px', fontSize: '1.05rem' }}
              >
                {generatingRevision ? (
                  <><RefreshCw className="animate-spin" size={20} /> Building your session...</>
                ) : (
                  <><PlayCircle size={20} /> Start Revision Session</>
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🧠 Your {revisionMode} Revision</h4>
                <button className="btn btn-secondary" onClick={() => setRevisionCards(null)}>Start Over</button>
              </div>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {revisionCards.map((card, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                      {card.topic_title}
                    </h5>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Definition:</strong>
                      <p style={{ fontSize: '0.95rem', color: '#334155', marginTop: '4px' }}>{card.quick_definition}</p>
                    </div>
                    
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Points:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {card.key_points.map((pt, pIdx) => (
                          <li key={pIdx} style={{ fontSize: '0.9rem', color: '#334155' }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ background: '#eff6ff', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', textAlign: 'center', marginTop: '10px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>Revision Complete! 🎉</h4>
                <p style={{ fontSize: '0.95rem', color: '#1e3a8a', marginBottom: '16px' }}>Want to test yourself on these topics?</p>
                <button className="btn btn-ai" onClick={() => {
                  setQuizTopic(revisionTopics.join(', '));
                  setActiveTab('quiz');
                }}>
                  Yes, Quiz Me
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Quiz Modal */}
      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
        />
      )}
    </div>
  );
};
