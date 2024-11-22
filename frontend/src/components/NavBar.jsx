import { useState } from "react";

// eslint-disable-next-line react/prop-types
const Navbar = ({ isConnected }) => {
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
    const section = document.getElementById("active-polls");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const closeAlert = () => {
    setShowAlert(false); // Close the alert
  };

  return (
    <nav className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="text-white text-2xl font-semibold">
          Decentralised Voting App
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-6">
          <button
            onClick={handleActivePollClick}
            className="text-white text-lg font-medium hover:text-purple-300 transition-colors"
          >
            Active Polls
          </button>
          <button
            onClick={handleCreatePollClick}
            className="text-white text-lg font-medium hover:text-purple-300 transition-colors"
          >
            Create Poll
          </button>
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
