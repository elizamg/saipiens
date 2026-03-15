import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import InstructorHomePage from "../pages/InstructorHomePage";
import CoursePage from "../pages/CoursePage";
import TeacherCoursePage from "../pages/TeacherCoursePage";
import CourseEditorPage from "../pages/CourseEditorPage";
import UnitUploadPage from "../pages/UnitUploadPage";
import CourseCreationPage from "../pages/CourseCreationPage";
import EditRosterPage from "../pages/EditRosterPage";
import ChatPage from "../pages/ChatPage";
import SettingsPage from "../pages/SettingsPage";
import FeedbackPage from "../pages/FeedbackPage";
import FeedbackCoursePage from "../pages/FeedbackCoursePage";
import FeedbackUnitPage from "../pages/FeedbackUnitPage";
import TeacherFeedbackPage from "../pages/TeacherFeedbackPage";
import TeacherFeedbackCoursePage from "../pages/TeacherFeedbackCoursePage";
import TeacherFeedbackStudentPage from "../pages/TeacherFeedbackStudentPage";
import TeacherFeedbackUnitPage from "../pages/TeacherFeedbackUnitPage";
import RequireRole from "../components/auth/RequireRole";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student routes */}
      <Route path="/home" element={<RequireRole role="student"><HomePage /></RequireRole>} />
      <Route path="/courses" element={<RequireRole role="student"><HomePage /></RequireRole>} />
      <Route path="/feedback" element={<RequireRole role="student"><FeedbackPage /></RequireRole>} />
      <Route path="/feedback/course/:courseId" element={<RequireRole role="student"><FeedbackCoursePage /></RequireRole>} />
      <Route path="/feedback/course/:courseId/unit/:unitId" element={<RequireRole role="student"><FeedbackUnitPage /></RequireRole>} />
      <Route path="/settings" element={<RequireRole role="student"><SettingsPage /></RequireRole>} />
      <Route path="/course/:courseId" element={<RequireRole role="student"><CoursePage /></RequireRole>} />
      <Route path="/course/:courseId/unit/:unitId/chat" element={<RequireRole role="student"><ChatPage /></RequireRole>} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<RequireRole role="instructor"><InstructorHomePage /></RequireRole>} />
      <Route path="/teacher/course/create" element={<RequireRole role="instructor"><CourseCreationPage /></RequireRole>} />
      <Route path="/teacher/course/:courseId" element={<RequireRole role="instructor"><TeacherCoursePage /></RequireRole>} />
      <Route path="/teacher/course/:courseId/roster" element={<RequireRole role="instructor"><EditRosterPage /></RequireRole>} />
      <Route path="/teacher/course/:courseId/unit/:unitId" element={<RequireRole role="instructor"><CourseEditorPage /></RequireRole>} />
      <Route path="/teacher/course/:courseId/upload" element={<RequireRole role="instructor"><UnitUploadPage /></RequireRole>} />
      <Route path="/teacher/feedback" element={<RequireRole role="instructor"><TeacherFeedbackPage /></RequireRole>} />
      <Route path="/teacher/feedback/course/:courseId" element={<RequireRole role="instructor"><TeacherFeedbackCoursePage /></RequireRole>} />
      <Route path="/teacher/feedback/course/:courseId/student/:studentId" element={<RequireRole role="instructor"><TeacherFeedbackStudentPage /></RequireRole>} />
      <Route path="/teacher/feedback/course/:courseId/student/:studentId/unit/:unitId" element={<RequireRole role="instructor"><TeacherFeedbackUnitPage /></RequireRole>} />
      <Route path="/teacher/settings" element={<RequireRole role="instructor"><SettingsPage /></RequireRole>} />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
