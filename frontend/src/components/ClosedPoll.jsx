import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PollRetrieverABI from "../abis/PollRetriever.json";
import LoadingSpinner from "./utility/LoadingSpinner";
import Pagination from "./utility/Pagination";

const ClosedPoll = () => {
  const [polls, setPolls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true); // Loading state
  const [pollsPerPage] = useState(6); // Adjust how many polls per page

  // Contract details
  const contractAddressPollRetriever = import.meta.env
    .VITE_POLLRETRIEVER_CONTRACT_ADDRESS;

  // Fetch closed polls from the blockchain
  const fetchPolls = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddressPollRetriever,
        PollRetrieverABI,
        provider
      );

      // Fetch closed polls from the contract
      const pollsData = await contract.getClosedPolls();

      // Format the polls data for use in the frontend
      const formattedPolls = await Promise.all(
        pollsData.map(async (poll) => {
          const voteCounts = poll.voteCounts.map((vote) => vote.toNumber());
          const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
          const options = poll.options;

          return {
            id: poll.id.toNumber(), // Convert BigNumber to regular number
            name: poll.name,
            options,
            voteCounts,
            totalVotes,
            percentages: voteCounts.map((count) =>
              totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0
            ),
          };
        })
      );

      setPolls(formattedPolls);
    } catch (error) {
      console.error("Error fetching closed polls:", error);
    }
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

  useEffect(() => {
    setLoading(true); // Start loading
    fetchPolls(); // Fetch polls when the component is mounted
    setTimeout(() => {
      setLoading(false); // Hide loading after 1 second
    }, 900);
  }, []);

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-8 rounded-lg shadow-lg mt-8">
      <h2 className="text-white text-3xl font-bold text-center mb-6">
        Closed Polls
      </h2>

      {/* Spinner for loading state */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Poll Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ml-7">
            {currentPolls.map((poll) => (
              <div
                key={poll.id}
                className="w-[350px] h-[350px] bg-white p-6 rounded-lg shadow-md flex flex-col"
              >
                <h3 className="text-xl font-bold text-purple-600 mb-6">
                  {poll.name}
                </h3>
                <div className="mb-4 flex-grow overflow-auto max-h-[250px] scrollbar-hide">
                  {poll.options.map((option, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800 mb-1 font-semibold">
                          {option}
                        </p>
                        <p className="text-gray-600 font-semibold">
                          {poll.voteCounts[index]} ({poll.percentages[index]}%)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-lg h-2">
                        <div
                          className="bg-blue-600 h-full rounded-lg"
                          style={{
                            width: `${poll.percentages[index]}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-auto text-red-600 font-bold text-center">
                  Poll Closed
                </p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            prevPage={prevPage}
            nextPage={nextPage}
          />
        </>
      )}
    </div>
  );
};

export default ClosedPoll;
