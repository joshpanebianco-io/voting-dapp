import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";
import PollManagerABI from "../abis/PollManager.json";

// eslint-disable-next-line react/prop-types
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
  const [showVoted, setShowVoted] = useState(false); // State to toggle showing voted polls
  const [walletAddress, setWalletAddress] = useState(""); // State to track the current wallet address
  const pollsPerPage = 6;

  const contractAddressPollRetriever = import.meta.env
    .VITE_POLLRETRIEVER_CONTRACT_ADDRESS;
  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

  // Fetch current wallet address
  const fetchWalletAddress = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);
  };

  useEffect(() => {
    if (isConnected) {
      fetchWalletAddress(); // Fetch wallet address if connected
    }
  }, [isConnected]);

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

      setHasVoted((prev) => ({
        ...prev,
        [walletAddress]: {
          ...prev[walletAddress],
          [pollId]: true,
        },
      }));
    } catch (error) {
      console.error("Error voting in poll:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Filter polls based on whether the user has voted or not
  const filteredPolls = showVoted
    ? polls.filter((poll) => hasVoted[walletAddress]?.[poll.id]) // Show voted polls for the current wallet
    : polls.filter((poll) => !hasVoted[walletAddress]?.[poll.id]); // Show polls user has not voted on for the current wallet

  // Paginate filtered polls
  const currentPolls = filteredPolls.slice(
    (currentPage - 1) * pollsPerPage,
    currentPage * pollsPerPage
  );

  const totalPages = Math.ceil(filteredPolls.length / pollsPerPage);

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
      <div className="flex items-center justify-center mb-6">
        <h2 className="text-white text-3xl font-bold mr-4">Active Polls</h2>
        <button
          onClick={() => setShowVoted(!showVoted)}
          className="bg-gray-800 text-white py-1 px-3 rounded-lg hover:bg-gray-600 focus:outline-none text-sm align-middle"
        >
          {showVoted ? "Show Active" : "Show Voted"}
        </button>
      </div>

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
                <h3 className="text-xl font-semibold mb-4">{poll.name}</h3>
                <p className="mb-2 text-gray-600">Poll duration: {formatTime(poll.duration)} minutes</p>
                {poll.options.map((option, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="radio"
                      id={`option-${poll.id}-${index}`}
                      name={`poll-${poll.id}`}
                      value={option}
                      onChange={() => handleOptionChange(poll.id, option)}
                      disabled={hasVoted[walletAddress]?.[poll.id]}
                    />
                    <label htmlFor={`option-${poll.id}-${index}`} className="ml-2 text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}

                {/* Show voting status or participation button */}
                {hasVoted[walletAddress]?.[poll.id] ? (
                  <button className="bg-green-500 text-white py-2 px-4 rounded-md mt-4" disabled>
                    Voted
                  </button>
                ) : isParticipating[poll.id] ? (
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4"
                    onClick={() => handleVoting(poll.id)}
                  >
                    Vote
                  </button>
                ) : (
                  <button
                    className="bg-yellow-500 text-white py-2 px-4 rounded-md mt-4"
                    onClick={() => handleParticipation(poll.id)}
                  >
                    Participate
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg mr-4"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg ml-4"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Please Connect Your Wallet</h2>
            <p className="mb-4">To participate in or vote on polls, please connect your MetaMask wallet.</p>
            <button
              onClick={closeModal}
              className="bg-red-500 text-white py-2 px-4 rounded-md"
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
