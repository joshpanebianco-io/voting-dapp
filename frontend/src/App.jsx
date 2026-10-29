import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { PollsProvider } from "./context/PollsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { WalletProvider } from "./context/WalletContext";
import { AboutPage } from "./pages/AboutPage";
import { CreatePollPage } from "./pages/CreatePollPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PollDetailPage } from "./pages/PollDetailPage";
import { PollsPage } from "./pages/PollsPage";
import { ResultsPage } from "./pages/ResultsPage";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WalletProvider>
          <PollsProvider>
            <BrowserRouter basename={basename}>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="polls" element={<PollsPage />} />
                  <Route path="polls/:id" element={<PollDetailPage />} />
                  <Route path="results" element={<ResultsPage />} />
                  <Route path="create" element={<CreatePollPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </PollsProvider>
        </WalletProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
