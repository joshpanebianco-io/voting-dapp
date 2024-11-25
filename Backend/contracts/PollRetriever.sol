// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PollManager.sol";

contract PollRetriever {
    PollManager public pollManager;

    // Struct to encapsulate poll data
    struct Poll {
        uint256 pollId;
        string pollName;
        uint256 duration;
        uint256 startTime;
        bool isActive;
        string[] options; // Array of options for each poll
    }

    constructor(address _pollManagerAddress) {
        pollManager = PollManager(_pollManagerAddress);
    }

    // Function to get a specific poll by its ID, including its options
    function getPoll(uint256 _pollId) public view returns (Poll memory) {
        // Retrieve the poll details
        (uint256 pollId, string memory pollName, uint256 duration, uint256 startTime, bool isActive) = pollManager.polls(_pollId);
        
        // Retrieve the poll options
        string[] memory options = pollManager.getPollOptions(_pollId);

        // Return a structured Poll object
        return Poll(pollId, pollName, duration, startTime, isActive, options);
    }

    // Function to get all active polls, including their options
    function getActivePolls() public view returns (Poll[] memory) {
        uint256 activePollCount = 0;

        // Count the active polls
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                activePollCount++;
            }
        }

        // Create an array to hold the polls
        Poll[] memory activePolls = new Poll[](activePollCount);
        uint256 index = 0;

        // Collect the active polls, including their options
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                (uint256 pollId, string memory pollName, uint256 duration, uint256 startTime, bool isActive) = pollManager.polls(i);
                string[] memory options = pollManager.getPollOptions(i); // Retrieve the options
                activePolls[index] = Poll(pollId, pollName, duration, startTime, isActive, options);
                index++;
            }
        }

        return activePolls;
    }

    // Function to get all closed polls, including their options
    function getClosedPolls() public view returns (Poll[] memory) {
        uint256 closedPollCount = 0;

        // Count the closed polls
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (!pollManager.isPollActive(i)) {
                closedPollCount++;
            }
        }

        // Create an array to hold the polls
        Poll[] memory closedPolls = new Poll[](closedPollCount);
        uint256 index = 0;

        // Collect the closed polls, including their options
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (!pollManager.isPollActive(i)) {
                (uint256 pollId, string memory pollName, uint256 duration, uint256 startTime, bool isActive) = pollManager.polls(i);
                string[] memory options = pollManager.getPollOptions(i); // Retrieve the options
                closedPolls[index] = Poll(pollId, pollName, duration, startTime, isActive, options);
                index++;
            }
        }

        return closedPolls;
    }
}