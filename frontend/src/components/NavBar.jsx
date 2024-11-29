import { useState } from "react";
import NavConnectWallet from "./NavConnectWallet";

// eslint-disable-next-line react/prop-types
const Navbar = ({ isConnected, setIsConnected }) => {
  const [showAlert, setShowAlert] = useState(false); // State to control alert visibility

  const handleCreatePollClick = () => {
    if (isConnected) {
      const section = document.getElementById("create-poll-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setShowAlert(true); // Show the alert if not connected
    }
  };

  const handleActivePollClick = () => {
    const section = document.getElementById("active-polls-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClosedPollClick = () => {
    const section = document.getElementById("closed-polls-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const closeAlert = () => {
    setShowAlert(false); // Close the alert
  };

  const handleLogoClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <nav className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 shadow-lg fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div
          className="text-white text-2xl font-semibold cursor-pointer hover:text-purple-300 transition-colors"
          onClick={handleLogoClick} // Scroll to top on click
        >
          DecentraVote
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-6 items-center">
          <button
            onClick={handleCreatePollClick}
            className="text-white text-lg font-medium hover:text-purple-300 transition-colors"
          >
            Create Poll
          </button>
          <button
            onClick={handleActivePollClick}
            className="text-white text-lg font-medium hover:text-purple-300 transition-colors"
          >
            Active Polls
          </button>
          <button
            onClick={handleClosedPollClick}
            className="text-white text-lg font-medium hover:text-purple-300 transition-colors"
          >
            Results
          </button>
          {/* Connect Wallet */}
          <NavConnectWallet setIsConnected={setIsConnected} />
          
        </div>
      </div>

      {/* Popup Alert */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-gray-800 font-medium mb-4">
              You must connect your wallet to create a poll.
            </p>
            <button
              onClick={closeAlert}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
