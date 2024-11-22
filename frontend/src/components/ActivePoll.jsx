import React, { useState } from "react";

const ActivePoll = ({ isConnected }) => {
  // Dummy data for active polls
  const [polls, setPolls] = useState([
    {
      id: 1,
      name: "Favorite Programming Language",
      options: ["JavaScript", "Python", "C#", "Go"],
    },
    {
      id: 2,
      name: "Preferred Frontend Framework",
      options: ["React", "Vue", "Angular", "Svelte"],
    },
    {
      id: 3,
      name: "Best Backend Language",
      options: ["Node.js", "Ruby", "Java", "C++"],
    },
  ]);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [isParticipating, setIsParticipating] = useState({});
  const [showModal, setShowModal] = useState(false); // State to control modal visibility

  // Handle option selection
  const handleOptionChange = (pollId, option) => {
    setSelectedOptions({ ...selectedOptions, [pollId]: option });
  };

  // Handle participation
  const handleParticipation = (pollId) => {
    if (!isConnected) {
      setShowModal(true); // Show the modal if not connected
      return;
    }
    setIsParticipating({ ...isParticipating, [pollId]: true });
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-white text-3xl font-bold text-center mb-6">
        Active Polls
      </h2>
      <div className="flex flex-wrap gap-8">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="flex-1 min-w-[300px] max-w-[48%] bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-bold text-purple-600 mb-4">
              {poll.name}
            </h3>
            <div className="mb-4">
              {poll.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`${poll.id}-${option}`}
                    name={`poll-${poll.id}`}
                    value={option}
                    onChange={() => handleOptionChange(poll.id, option)}
                    disabled={!isParticipating[poll.id]} // Disable until participation starts
                    className="mr-2 text-blue-500 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${poll.id}-${option}`}
                    className="text-gray-800"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {!isParticipating[poll.id] ? (
              <button
                onClick={() => handleParticipation(poll.id)}
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Participate
              </button>
            ) : (
              <p className="text-green-600 font-bold text-center">
                You can now vote!
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Modal for wallet connection prompt */}
      {showModal && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
          >
            <h3 className="text-xl font-bold text-center text-red-600">
              You must be connected to a wallet!
            </h3>
            <p className="text-gray-700 text-center mt-4">
              Please connect your wallet to participate in this poll.
            </p>
            <div className="mt-6 text-center">
              <button
                onClick={closeModal}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePoll;
