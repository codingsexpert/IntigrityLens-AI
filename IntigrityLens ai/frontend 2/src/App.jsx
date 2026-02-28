import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ExamProvider } from './store/examStore.jsx'
import Navbar  from './components/Navbar.jsx'
import Verify  from './pages/Verify.jsx'
import Exam    from './pages/Exam.jsx'
import Monitor from './pages/Monitor.jsx'
import Report  from './pages/Report.jsx'

function App() {
  return (
    <ExamProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"        element={<Navigate to="/verify" replace />} />
          <Route path="/verify"  element={<Verify />} />
          <Route path="/exam"    element={<Exam />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/report"  element={<Report />} />
        </Routes>
      </BrowserRouter>
    </ExamProvider>
  )
}

export default App
