import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";
import PollManagerABI from "../abis/PollManager.json";
import LoadingSpinner from "./utility/LoadingSpinner";
import ModalLoadingSpinner from "./utility/ModalLoadingSpinner";
import { useNavigate, useLocation } from "react-router-dom";
import PollDetails from "./PollDetails";
import Pagination from "./utility/Pagination";
import { v4 as uuidv4 } from "uuid";

// eslint-disable-next-line react/prop-types
const ActivePoll = ({ isConnected }) => {
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isParticipating, setIsParticipating] = useState({});
  const [hasVoted, setHasVoted] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showVoted, setShowVoted] = useState(() => {
    const savedShowVoted = localStorage.getItem("showVoted");
    return savedShowVoted ? JSON.parse(savedShowVoted) : false;
  });
  const [loading, setLoading] = useState(true); // Loading state
  const [loadingMessage, setLoadingMessage] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState("");
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showPollModal, setShowPollModal] = useState(null);
  const [pollIdMapping, setPollIdMapping] = useState({});
  const pollsPerPage = 6;

  const navigate = useNavigate();
  const location = useLocation();

  const contractAddressPollRetriever = import.meta.env
    .VITE_POLLRETRIEVER_CONTRACT_ADDRESS;
  const contractAddressPollManager = import.meta.env
    .VITE_POLLMANAGER_CONTRACT_ADDRESS;

  const getPersistentFrontendId = (pollName) => {
    // Check localStorage for the existing ID for this poll
    let storedFrontendId = localStorage.getItem(pollName);
    if (!storedFrontendId) {
      // If not found, generate a new UUID, store it, and return it
      storedFrontendId = uuidv4();
      localStorage.setItem(pollName, storedFrontendId); // Store it in localStorage
    }
    return storedFrontendId;
  };

  const fetchPolls = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressPollRetriever,
        PollRetrieverABI,
        provider
      );

      const pollsData = await contract.getActivePolls();

      if (isConnected) {
        // Fetch participation and voting status only when connected
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const pollManagerContract = new ethers.Contract(
          contractAddressPollManager,
          PollManagerABI,
          provider
        );

        const pollsWithStatus = await Promise.all(
          pollsData.map(async (poll) => {
            const frontendId = getPersistentFrontendId(poll.name);
            const pollId = poll.id.toNumber();

            setPollIdMapping((prev) => ({
              ...prev,
              [frontendId]: pollId,
            }));

            const hasUserParticipated =
              await pollManagerContract.hasParticipated(pollId, userAddress);
            const hasUserVoted = await pollManagerContract.hasVoted(
              pollId,
              userAddress
            );

            let userVote = null;

            if (hasUserVoted) {
              const voteIndex = await pollManagerContract.getUserVote(
                pollId,
                userAddress
              );
              userVote = poll.options[voteIndex];
            }

            return {
              ...poll,
              frontendId,
              id: pollId,
              hasParticipated: hasUserParticipated,
              hasVoted: hasUserVoted,
              duration: poll.duration.toNumber(),
              startTime: poll.startTime.toNumber(),
              options: poll.options,
              userVote: userVote,
            };
          })
        );

        setPolls(pollsWithStatus);
      } else {
        // When not connected, just fetch active polls
        const pollsWithoutStatus = pollsData.map((poll) => ({
          ...poll,
          id: poll.id.toNumber(),
          duration: poll.duration.toNumber(),
          startTime: poll.startTime.toNumber(),
          options: poll.options,
          hasParticipated: false,
          hasVoted: false,
          userVote: null,
        }));

        setPolls(pollsWithoutStatus);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  };

  useEffect(() => {
    const loadPolls = async () => {
      setLoading(true); // Start loading
      await fetchPolls();
      setTimeout(() => {
        setLoading(false); // Hide loading after 1 second
      }, 900);
    };
    loadPolls();
  }, [isConnected, hasVoted]);

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

  // useEffect(() => {
  //   const pollIdFromUrl = new URLSearchParams(location.search).get("pollId");
  //   if (pollIdFromUrl) {
  //     setShowPollModal(true);
  //     setSelectedPoll(parseInt(pollIdFromUrl, 10)); // Set the pollId from the URL
  //   }
  // }, [location.search]); // Re-run when the URL changes

  useEffect(() => {
    const pollIdFromUrl = new URLSearchParams(location.search).get("pollId");
    if (pollIdFromUrl) {
      // Decode the frontendId back to the real pollId using the mapping
      const pollId = pollIdMapping[pollIdFromUrl];
      if (pollId) {
        setShowPollModal(true);
        setSelectedPoll(pollId); // Set the actual pollId (not frontendId)
      }
    }
  }, [location.search, pollIdMapping]);

  useEffect(() => {
    const savedShowVoted = localStorage.getItem("showVoted");
    if (savedShowVoted !== null) {
      setShowVoted(JSON.parse(savedShowVoted)); // Parse and set the saved state
    }
  }, []);

  // Save the 'showVoted' state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("showVoted", JSON.stringify(showVoted)); // Save as string
  }, [showVoted]);

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

      setModalLoading(true);
      setLoadingMessage("Confirm transaction");
      const transaction = await contract.participate(pollId);
      setLoadingMessage("Your voting token is being generated");
      await transaction.wait();
      setShowSuccessModal("Your voting token has been successfully generated");
      // Update participation status
      setIsParticipating({ ...isParticipating, [pollId]: true });
      // Update the poll state to reflect that the user has participated
      setPolls((prevPolls) =>
        prevPolls.map((poll) =>
          poll.id === pollId ? { ...poll, hasParticipated: true } : poll
        )
      );
    } catch (error) {
      console.error("Error participating in poll:", error);
    } finally {
      setModalLoading(false);
      setLoadingMessage("");
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

      setModalLoading(true);
      setLoadingMessage("Confirm transaction");
      const transaction = await contract.vote(pollId, optionIndex);
      setLoadingMessage("Your vote is being submitted");
      await transaction.wait();
      setShowSuccessModal("Your vote has been successfully submitted");
      // Update voting status
      setHasVoted({ ...hasVoted, [pollId]: true });
      setPolls((prevPolls) =>
        prevPolls.map((poll) =>
          poll.id === pollId ? { ...poll, hasVoted: true } : poll
        )
      );
      // Update selected option to reflect the vote
      setSelectedOptions({
        ...selectedOptions,
        [pollId]: selectedOption,
      });
    } catch (error) {
      console.error("Error voting in poll:", error);
    } finally {
      setModalLoading(false);
      setLoadingMessage("");
    }
  };

  // const handlePollClick = (pollId) => {
  //   setSelectedPoll(pollId);
  //   setShowPollModal(true);
  //   navigate(`?pollId=${pollId}`); // Update the URL with the pollId
  // };

  const handlePollClick = (frontendId) => {
    // When a poll is clicked, navigate using the frontendId (obfuscated ID)
    setSelectedPoll(frontendId);
    navigate(`?pollId=${frontendId}`);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal("");

    const poll = polls.find((p) => p.id === selectedPoll);
    if (poll.hasVoted) {
      closePollModal();
    }
  };

  const closePollModal = () => {
    setShowPollModal(false);
    setSelectedPoll(null); // Reset selected poll
    navigate(""); // Remove pollId from the URL
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const filteredPolls = showVoted
    ? polls.filter((poll) => poll.hasVoted)
    : polls.filter((poll) => !poll.hasVoted);

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

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      {/* Poll section */}
      <div className="flex items-center justify-center mb-6">
        <h2 className="text-white text-3xl font-bold mr-4">Active Polls</h2>
        {isConnected && (
          <button
            onClick={() => setShowVoted(!showVoted)}
            className="bg-gray-800 text-white py-1 px-3 rounded-lg hover:bg-gray-600 focus:outline-none text-sm align-middle"
          >
            {showVoted ? "Show Active" : "Show Voted"}
          </button>
        )}
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
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
                    <h3
                      className="text-xl font-bold text-purple-600 mb-4 cursor-pointer hover:text-blue-400"
                      onClick={() => handlePollClick(poll.frontendId)}
                    >
                      {poll.name}
                    </h3>
                    <div className="mb-4 flex-grow">
                      {poll.options.map((option, index) => (
                        <div
                          key={index}
                          className={`flex items-center mb-2 ${
                            poll.hasVoted && poll.userVote === option
                              ? "bg-white-100"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            id={`${poll.id}-${option}`}
                            name={`poll-${poll.id}`}
                            value={option}
                            checked={
                              poll.hasVoted
                                ? poll.userVote === option
                                : selectedOptions[poll.id] === option
                            }
                            onChange={() => handleOptionChange(poll.id, option)}
                            disabled={!poll.hasParticipated || poll.hasVoted}
                            className="mr-2 text-blue-500 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`${poll.id}-${option}`}
                            className={`text-gray-800 ${
                              poll.hasVoted && poll.userVote === option
                                ? "font-bold text-purple-600"
                                : ""
                            }`}
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="text-center font-bold mb-4">
                      <p className="text-black inline">Poll closes in: </p>
                      <p className="text-blue-600 inline">
                        {formatTime(poll.timeRemaining)}
                      </p>
                    </div>

                    {!poll.hasParticipated ? (
                      <button
                        onClick={() => handleParticipation(poll.id)}
                        className="mt-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none"
                        disabled={poll.hasVoted}
                      >
                        Participate
                      </button>
                    ) : poll.hasVoted ? (
                      <button
                        disabled
                        className="mt-auto bg-gray-400 text-white py-2 px-4 rounded-lg"
                      >
                        Voted
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVoting(poll.id)}
                        className="mt-auto bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-600 focus:outline-none"
                      >
                        Vote
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                prevPage={prevPage}
                nextPage={nextPage}
              />
            </>
          )}

          {/* Loading Modal */}
          {modalLoading && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 -mb-10">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
                <h3 className="text-xl font-bold text-center text-gray-800">
                  {loadingMessage}
                  <div className="mt-4">
                    <ModalLoadingSpinner />
                  </div>
                </h3>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-xl font-bold text-green-600 text-center">
                  Success!
                </h3>
                <p className="text-gray-800 font-bold text-xl text-center mt-4">
                  {showSuccessModal}
                </p>
                <div className="mt-6 text-center">
                  <button
                    onClick={closeSuccessModal}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPollModal && selectedPoll && (
            <PollDetails
              showPollModal={showPollModal}
              selectedPoll={selectedPoll}
              currentPolls={currentPolls}
              selectedOptions={selectedOptions}
              handleOptionChange={handleOptionChange}
              handleParticipation={handleParticipation}
              handleVoting={handleVoting}
              handlePollClick={handlePollClick}
              closePollModal={closePollModal}
              formatTime={formatTime}
            />
          )}

          {/* Connect Wallet Modal */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-red-600 mb-4">
                  Please Connect Your Wallet
                </h3>
                <p className="text-gray-800 mb-4">
                  To participate in a poll, please connect your wallet first.
                </p>
                <button
                  onClick={closeModal}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none w-full"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivePoll;
