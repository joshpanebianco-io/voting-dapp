import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";
import PollManagerABI from "../abis/PollManager.json";

const ActivePoll = ({ isConnected }) => {
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(() => {
    const saved = localStorage.getItem("selectedOptions");
    return saved ? JSON.parse(saved) : {};
  });
  const [isParticipating, setIsParticipating] = useState(() => {
    const saved = localStorage.getItem("isParticipating");
    return saved ? JSON.parse(saved) : {};
  });
  const [hasVoted, setHasVoted] = useState(() => {
    const saved = localStorage.getItem("hasVoted");
    return saved ? JSON.parse(saved) : {};
  });
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pollsPerPage = 6;

  const contractAddressPollRetriever = import.meta.env
    .VITE_POLLRETRIEVER_CONTRACT_ADDRESS;
  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

  const fetchPolls = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressPollRetriever,
        PollRetrieverABI,
        provider
      );

      const pollsData = await contract.getActivePolls();

      const formattedPolls = pollsData.map((poll) => ({
        id: poll.pollId.toNumber(),
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

  // Save data to local storage on changes
  useEffect(() => {
    localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  }, [selectedOptions]);

  useEffect(() => {
    localStorage.setItem("isParticipating", JSON.stringify(isParticipating));
  }, [isParticipating]);

  useEffect(() => {
    localStorage.setItem("hasVoted", JSON.stringify(hasVoted));
  }, [hasVoted]);

  const handleOptionChange = (pollId, option) => {
    setSelectedOptions({ ...selectedOptions, [pollId]: option });
  };

  const handleParticipation = async (pollId) => {
    if (!isConnected) {
      setShowModal(true);
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddressPollManager,
        PollManagerABI,
        signer
      );

      await contract.participate(pollId);

      setIsParticipating({ ...isParticipating, [pollId]: true });
    } catch (error) {
      console.error("Error participating in poll:", error);
    }
  };

  const handleVoting = async (pollId) => {
    if (!isConnected) {
      setShowModal(true);
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddressPollManager,
        PollManagerABI,
        signer
      );

      const selectedOption = selectedOptions[pollId];
      if (!selectedOption) {
        alert("Please select an option before voting.");
        return;
      }

      const poll = polls.find((poll) => poll.id === pollId);
      const optionIndex = poll.options.indexOf(selectedOption);
      if (optionIndex === -1) {
        alert("Invalid option selected.");
        return;
      }

      await contract.vote(pollId, optionIndex);

      setHasVoted({ ...hasVoted, [pollId]: true });
    } catch (error) {
      console.error("Error voting in poll:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const indexOfLastPoll = currentPage * pollsPerPage;
  const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
  const currentPolls = polls.slice(indexOfFirstPoll, indexOfLastPoll);

  const totalPages = Math.ceil(polls.length / pollsPerPage);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const calculateRemainingTime = (poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = poll.startTime + poll.duration * 60;
    const timeRemaining = endTime - currentTime;
    return timeRemaining > 0 ? timeRemaining : 0;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPolls((prevPolls) =>
        prevPolls
          .map((poll) => {
            const timeRemaining = calculateRemainingTime(poll);
            const isPollActive = timeRemaining > 0;
            return {
              ...poll,
              timeRemaining,
              isPollActive,
            };
          })
          .filter((poll) => poll.isPollActive)
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
                        checked={selectedOptions[poll.id] === option} // Ensure the radio button is checked
                        onChange={() => handleOptionChange(poll.id, option)}
                        disabled={ !isParticipating[poll.id] || hasVoted[poll.id] }
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
                ) : hasVoted[poll.id] ? (
                  <p className="mt-auto text-green-600 font-bold text-center">
                    You have voted!
                  </p>
                ) : (
                  <button
                    onClick={() => handleVoting(poll.id)}
                    className="mt-auto bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Vote
                  </button>
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
                className="bg-blue-600 text-white py-2 px-4 rounded-l-lg hover:bg-blue-700 focus:outline-none"
              >
                Previous
              </button>
              <span className="mx-4 text-white">{currentPage}</span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white py-2 px-4 rounded-r-lg hover:bg-blue-700 focus:outline-none"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal for connecting wallet */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              Please connect your wallet
            </h3>
            <button
              onClick={closeModal}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePoll;
