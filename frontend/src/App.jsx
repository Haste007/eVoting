import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/User/Login";
import { Register } from "./pages/Admin/CitizenManagement/Components/Register";
import { Voting } from "./pages/User/Voting";
import { AdminPanel } from "./pages/Admin/AdminPanel";
import { AdminLoginPage } from "./pages/Admin/AdminLoginPage";

function App() {
  // Helper function to check if a valid NID is present in localStorage
  const isAuthenticatedForVoting = () => {
    const citizenId = localStorage.getItem("citizenId");
    return citizenId && citizenId.trim() !== ""; // Ensure NID exists and is not empty
  };

  // Helper function to check if admin is authenticated
  const isAdminAuthenticated = () => {
    return localStorage.getItem("adminAuthenticated") === "true";
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Protected Route for Voting */}
        <Route
          path="/voting"
          element={
            isAuthenticatedForVoting() ? (
              <Voting />
            ) : (
              <Navigate to="/" replace /> // Redirect to Login if not authenticated
            )
          }
        />

        {/* Protected Route for Admin */}
        <Route
          path="/admin"
          element={
            isAdminAuthenticated() ? (
              <AdminPanel />
            ) : (
              <Navigate to="/admin-login" replace /> // Redirect to Admin Login if not authenticated
            )
          }
        />

        {/* Redirect unknown routes to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
