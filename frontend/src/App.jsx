import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Navbar from "./components/NavBar";
import CreatePoll from "./components/CreatePoll";
import ActivePoll from "./components/ActivePoll";

function App() {
  const [isConnected, setIsConnected] = useState(false); // Manage connection state

  return (
    <div className="bg-gray-800 min-h-screen relative">
      {/* Navbar pinned to the top */}
      <Navbar isConnected={isConnected} className="sticky top-0 z-50" />

      {/* ConnectWallet component */}
      <div className="relative z-10 flex justify-center mt-4">
        <ConnectWallet setIsConnected={setIsConnected} />
      </div>

      {/* Conditionally render CreatePoll only if connected */}
      {isConnected ? (
        <div
          id="create-poll-section"
          className="flex items-center justify-center mt-4"
        >
          <div className="w-full max-w-2xl">
            <CreatePoll />
          </div>
        </div>
      ) : null}

      {/* ActivePoll Section */}
      <div id="active-polls" className="mt-8">
        <ActivePoll isConnected={isConnected} />
      </div>

      {/* Additional space below ActivePoll */}
      <div className="bg-gray-800 mt-8 py-16"></div>
    </div>
  );
}

export default App;
