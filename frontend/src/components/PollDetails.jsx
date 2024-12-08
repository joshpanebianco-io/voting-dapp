// PollModal.jsx
// eslint-disable-next-line no-unused-vars
import React from "react";
import PropTypes from "prop-types";

const PollDetails = ({
  showPollModal,
  selectedPoll,
  currentPolls,
  selectedOptions,
  handleOptionChange,
  handleParticipation,
  handleVoting,
  handlePollClick,
  closePollModal,
  formatTime,
}) => {
  if (!showPollModal || !selectedPoll) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-100">
      <div className="bg-blue-600 p-6 rounded-lg shadow-lg">
        {currentPolls
          .filter((poll) => poll.id === selectedPoll)
          .map((poll) => (
            <div
              key={poll.id}
              className="w-[350px] h-[350px] bg-white p-6 rounded-lg shadow-md flex flex-col"
            >
              {/* <h3
                className="text-xl font-bold text-purple-600 mb-4"
                onClick={() => handlePollClick(poll.id)}
              >
                {poll.name}
              </h3> */}

              <div className="justify-between flex">
                <h3
                  className="text-xl font-bold text-purple-600 mb-4"
                  onClick={() => handlePollClick(poll.id)}
                >
                  {poll.name}
                </h3>
                <button
                  className="-mt-14 -mr-2 font-semibold text-2xl text-gray-500 hover:text-gray-300"
                  onClick={closePollModal}
                >
                  &times; {/* You can use 'X' here instead of 'Close' */}
                </button>
              </div>

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
              {/* <button
                className="-mb-4 mt-2 hover:text-gray-400"
                onClick={closePollModal}
              >
                Close
              </button> */}
            </div>
          ))}
      </div>
    </div>
  );
};

PollDetails.propTypes = {
  showPollModal: PropTypes.bool.isRequired,
  selectedPoll: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  currentPolls: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(PropTypes.string).isRequired,
      hasVoted: PropTypes.bool.isRequired,
      hasParticipated: PropTypes.bool.isRequired,
      userVote: PropTypes.string,
      timeRemaining: PropTypes.number.isRequired,
    })
  ).isRequired,
  selectedOptions: PropTypes.objectOf(PropTypes.string).isRequired,
  handleOptionChange: PropTypes.func.isRequired,
  handleParticipation: PropTypes.func.isRequired,
  handleVoting: PropTypes.func.isRequired,
  handlePollClick: PropTypes.func.isRequired,
  closePollModal: PropTypes.func.isRequired,
  formatTime: PropTypes.func.isRequired,
};

export default PollDetails;
