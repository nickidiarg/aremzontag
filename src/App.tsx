import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import CardRoute from "./pages/CardRoute";
import Admin from "./pages/Admin";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import UpdatePassword from "./pages/UpdatePassword";
import ForgotPassword from "./pages/ForgotPassword";
import SupportButton from "@/components/SupportButton"; // ⬅️ IMPORT THIS

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/c/:cardId" element={<CardRoute />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* ⬅️ ADD THE BUTTON HERE (It will float above everything) */}
        <SupportButton />

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;