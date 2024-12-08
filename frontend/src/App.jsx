import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import NavConnectWallet from "./components/NavConnectWallet";
import Navbar from "./components/NavBar";
import CreatePoll from "./components/CreatePoll";
import ActivePoll from "./components/ActivePoll";
import ClosedPoll from "./components/ClosedPoll";
import ActiveWallets from "./components/ActiveWallets"; // Import ActiveWallets component
import UseCase from "./components/UseCase";
import { BrowserRouter as Router } from "react-router-dom";


function App() {
  const [isConnected, setIsConnected] = useState(false); // Manage connection state

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
        <div className="relative z-10 flex justify-center mt-5">
          {/* Adjusted padding-top to create space below navbar */}
          <ConnectWallet setIsConnected={setIsConnected} />
        </div>
        {/* Conditionally render CreatePoll only if connected */}
        {isConnected && (
          <div
            id="create-poll-section"
            className="min-h-screen flex items-center justify-center mt-2" // Reduced space between ConnectWallet and CreatePoll
          >
            <div className="w-full max-w-2xl">
              <CreatePoll />
            </div>
          </div>
        )}
        {/* ActivePoll Section */}
        <div
          id="active-polls-section"
          className="min-h-screen justify-center pt-36" // Added padding-top to create space below the fixed navbar
        >
          <ActivePoll isConnected={isConnected} />
        </div>
        {/* Closed Polls Section */}
        <div
          id="closed-polls-section"
          className="min-h-screen justify-center pt-36" // Added padding-top to create space below the fixed navbar
        >
          <ClosedPoll isConnected={isConnected} />
        </div>
        {/* Use Case Section */}
        <div
          id="use-case-section" // Added id for consistency and navigation
          className="min-h-screen justify-center pt-36" // Same padding as other sections
        >
          <UseCase />
        </div>
        {/* Additional space below */}
        <div className="bg-gray-800 mt-8 py-16"></div>
        {/* Active Wallets Floating Component */}
        <ActiveWallets isConnected={isConnected} />{" "}
        {/* Floating active wallet count */}
      </div>
    </Router>
  );
}

export default App;
