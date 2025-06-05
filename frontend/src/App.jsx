import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import NavConnectWallet from "./components/NavConnectWallet";
import Navbar from "./components/NavBar";
import CreatePoll from "./components/CreatePoll";
import ActivePoll from "./components/ActivePoll";
import ClosedPoll from "./components/ClosedPoll";
import UseCase from "./components/UseCase";
import { BrowserRouter as Router } from "react-router-dom";


function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [closedPollRefreshKey, setClosedPollRefreshKey] = useState(0);


  const refreshActivePoll = () => {
    setRefreshKey(prev => prev + 1);
  };

  const refreshClosedPoll = () => {
  setClosedPollRefreshKey(prev => prev + 1);
};


  return (
    <Router>
      <div className="bg-gray-800 min-h-screen relative overflow-y-auto">
        {/* Navbar pinned to the top */}
        <Navbar
          NavConnectWallet={NavConnectWallet}
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          className="sticky top-0 z-50 w-full h-16" // Fixed height for navbar and full width
        />
        {/* ConnectWallet component */}
        <div className="relative z-10 flex justify-center mt-3 sm:pt-0 sm:pb-0 pb-48">
          <ConnectWallet setIsConnected={setIsConnected} />
        </div>

        {/* Conditionally render CreatePoll only if connected */}
        {isConnected && (
          <div
            id="create-poll-section"
            className="min-h-screen flex items-center justify-center mt-2" // Reduced space between ConnectWallet and CreatePoll
          >
            <div className="w-full max-w-2xl">
              <CreatePoll onSuccess={refreshActivePoll} />
            </div>
          </div>
        )}
        {/* ActivePoll Section */}
        <div
          id="active-polls-section"
          className="min-h-screen justify-center pt-36" // Added padding-top to create space below the fixed navbar
        >
          <ActivePoll isConnected={isConnected} refreshKey={refreshKey} onPollClose={refreshClosedPoll} />
        </div>
        {/* Closed Polls Section */}
        <div
          id="closed-polls-section"
          className="min-h-screen justify-center pt-36" // Added padding-top to create space below the fixed navbar
        >
          <ClosedPoll isConnected={isConnected} refreshKey={closedPollRefreshKey} />
        </div>
        {/* Use Case Section */}
        <div
          id="use-case-section" // Added id for consistency and navigation
          className="min-h-screen justify-center pt-36" // Same padding as other sections
        >
          <UseCase />
        </div>
      </div>
    </Router>
  );
}

export default App;
