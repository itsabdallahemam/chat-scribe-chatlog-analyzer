
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatlogProvider } from "./contexts/ChatlogContext";

// Import layout
import Layout from "./components/Layout";

// Import pages
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import PromptRubricPage from "./pages/PromptRubricPage";
import DashboardPage from "./pages/DashboardPage";
import SatisfactionPage from "./pages/SatisfactionPage";
import CPRDetailsPage from "./pages/CPRDetailsPage";
import ResolutionPage from "./pages/ResolutionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatlogProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/prompt-rubric" element={<PromptRubricPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/satisfaction" element={<SatisfactionPage />} />
              <Route path="/cpr-details" element={<CPRDetailsPage />} />
              <Route path="/resolution-details" element={<ResolutionPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ChatlogProvider>
  </QueryClientProvider>
);

export default App;
