import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import CoursePage from "../pages/CoursePage";
import ChatPage from "../pages/ChatPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/course/:courseId" element={<CoursePage />} />
      <Route path="/course/:courseId/unit/:unitId/chat" element={<ChatPage />} />
      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
