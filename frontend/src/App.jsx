// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Welcome from "./pages/Welcome";
import WorkspacePage from "./pages/WorkspacePage";
import DocumentPage from "./pages/DocumentPage";
import { WorkspaceContext } from "./context/WorkspaceContext";

function App() {
  const workspace = { name: "My Team Workspace" };
  return (
    <WorkspaceContext.Provider value={workspace}>
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
        <Route path="/document/:documentId" element={<DocumentPage />} /> {/* ✅ New route */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
    </WorkspaceContext.Provider>
  );
}

export default App;
