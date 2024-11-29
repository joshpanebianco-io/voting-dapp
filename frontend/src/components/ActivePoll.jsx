import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";

// eslint-disable-next-line react/prop-types
const ActivePoll = ({ isConnected }) => {
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isParticipating, setIsParticipating] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const pollsPerPage = 6; // Number of polls per page

  // Contract details
  const contractAddressPollRetriever = import.meta.env
    .VITE_POLLRETRIEVER_CONTRACT_ADDRESS;

  // Fetch polls from the blockchain
  const fetchPolls = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressPollRetriever,
        PollRetrieverABI,
        provider
      );

      const pollsData = await contract.getActivePolls();

      // Format polls data for use in the frontend
      const formattedPolls = pollsData.map((poll) => ({
        id: poll.pollId.toNumber(), // Convert BigNumber to regular number
        name: poll.pollName,
        options: poll.options,
        duration: poll.duration.toNumber(),
        startTime: poll.startTime.toNumber(),
      }));

      setPolls(formattedPolls);
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Handle option selection
  const handleOptionChange = (pollId, option) => {
    setSelectedOptions({ ...selectedOptions, [pollId]: option });
  };

  // Handle participation
  const handleParticipation = (pollId) => {
    if (!isConnected) {
      setShowModal(true);
      return;
    }
    setIsParticipating({ ...isParticipating, [pollId]: true });
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Pagination logic
  const indexOfLastPoll = currentPage * pollsPerPage;
  const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
  const currentPolls = polls.slice(indexOfFirstPoll, indexOfLastPoll);

  // Handle page change
  const totalPages = Math.ceil(polls.length / pollsPerPage);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Countdown Timer logic
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const calculateRemainingTime = (poll) => {
    const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
    const endTime = poll.startTime + poll.duration * 60; // End time in seconds
    const timeRemaining = endTime - currentTime; // Time remaining in seconds
    return timeRemaining > 0 ? timeRemaining : 0;
  };

  // Update timer every second for each poll
  useEffect(() => {
    const interval = setInterval(() => {
      setPolls(
        (prevPolls) =>
          prevPolls
            .map((poll) => {
              const timeRemaining = calculateRemainingTime(poll);
              const isPollActive = timeRemaining > 0;
              return {
                ...poll,
                timeRemaining,
                isPollActive, // Update active status based on remaining time
              };
            })
            .filter((poll) => poll.isPollActive) // Filter out inactive polls
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-white text-3xl font-bold text-center mb-6">
        Active Polls
      </h2>

      {/* Conditional rendering for no active polls */}
      {polls.length === 0 ? (
        <p className="text-white text-lg text-center">
          There are currently no active polls.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ml-7">
            {currentPolls.map((poll) => (
              <div
                key={poll.id}
                className="w-[350px] h-[350px] bg-white p-6 rounded-lg shadow-md flex flex-col"
              >
                <h3 className="text-xl font-bold text-purple-600 mb-4">
                  {poll.name}
                </h3>
                <div className="mb-4 flex-grow">
                  {poll.options.map((option, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="radio"
                        id={`${poll.id}-${option}`}
                        name={`poll-${poll.id}`}
                        value={option}
                        onChange={() => handleOptionChange(poll.id, option)}
                        disabled={!isParticipating[poll.id]}
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

                {/* Countdown Timer */}
                <div className="text-center font-bold mb-4">
                  <p className="text-black inline">Poll closes in: </p>
                  <p className="text-blue-600 inline">
                    {formatTime(poll.timeRemaining)}
                  </p>
                </div>

                {!isParticipating[poll.id] ? (
                  <button
                    onClick={() => handleParticipation(poll.id)}
                    className="mt-auto bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Participate
                  </button>
                ) : (
                  <p className="mt-auto text-green-600 font-bold text-center">
                    You can now vote!
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && ( // Only show pagination if there are multiple pages
            <div className="flex justify-center items-center mt-6">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-white text-blue-600 font-bold py-2 px-4 mx-2 rounded-lg shadow hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-white font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-white text-blue-600 font-bold py-2 px-4 mx-2 rounded-lg shadow hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal for wallet connection prompt */}
      {showModal && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-800 font-medium mb-4 text-center">
              You must connect your wallet to participate in polls.
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
