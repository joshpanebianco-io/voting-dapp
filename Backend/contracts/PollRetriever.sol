// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PollManager.sol";

contract PollRetriever {
    PollManager public pollManager;

    struct Poll {
        uint256 id;
        string name;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        bool isActive; // Derived from `isPollActive`
        string[] options;
        uint256[] voteCounts; // Add the vote counts for each option
    }

    constructor(address _pollManagerAddress) {
        pollManager = PollManager(_pollManagerAddress);
    }

    function getPoll(uint256 _pollId) public view returns (Poll memory) {
        (
            uint256 id,
            string memory name,
            uint256 duration,
            uint256 startTime,
            uint256 endTime,
            string[] memory options,
            uint256[] memory voteCounts,
        ) = pollManager.getPoll(_pollId);

        bool isActive = pollManager.isPollActive(_pollId);

        return Poll(id, name, duration, startTime, endTime, isActive, options, voteCounts);
    }

    function getActivePolls() public view returns (Poll[] memory) {
        uint256 activePollCount = 0;

        // Count active polls where the user hasn't voted yet or hasn't participated
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                bool participated = pollManager.hasParticipated(i, msg.sender);
                bool voted = pollManager.hasVoted(i, msg.sender);

                if (!participated || (participated && !voted)) {
                    activePollCount++;
                }
            }
        }

        // Create array to store the results
        Poll[] memory activePolls = new Poll[](activePollCount);
        uint256 pollIndex = 0;

        // Populate the list of active polls
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                bool participated = pollManager.hasParticipated(i, msg.sender);
                bool voted = pollManager.hasVoted(i, msg.sender);

                // Add to list if the user hasn't participated or hasn't voted yet
                if (!participated || (participated && !voted)) {
                    (
                        uint256 id,
                        string memory name,
                        uint256 duration,
                        uint256 startTime,
                        uint256 endTime,
                        string[] memory options,
                        uint256[] memory voteCounts,
                    ) = pollManager.getPoll(i);

                    activePolls[pollIndex] = Poll(id, name, duration, startTime, endTime, true, options, voteCounts);
                    pollIndex++;
                }
            }
        }

        return activePolls;
    }

    // Returns the polls that the user has voted on
    function getVotedPolls() public view returns (Poll[] memory) {
        uint256 votedPollCount = 0;

        // Count how many polls the user has voted on
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.hasVoted(i, msg.sender)) {
                votedPollCount++;
            }
        }

        Poll[] memory votedPolls = new Poll[](votedPollCount);
        uint256 index = 0;

        // Populate the list of voted polls
        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.hasVoted(i, msg.sender)) {
                (
                    uint256 id,
                    string memory name,
                    uint256 duration,
                    uint256 startTime,
                    uint256 endTime,
                    string[] memory options,
                    uint256[] memory voteCounts,
                ) = pollManager.getPoll(i);

                votedPolls[index] = Poll(id, name, duration, startTime, endTime, true, options, voteCounts);
                index++;
            }
        }

        return votedPolls;
    }

    function getClosedPolls() public view returns (Poll[] memory) {
        uint256 closedCount = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (!pollManager.isPollActive(i)) {
                closedCount++;
            }
        }

        Poll[] memory closedPolls = new Poll[](closedCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (!pollManager.isPollActive(i)) {
                (
                    uint256 id,
                    string memory name,
                    uint256 duration,
                    uint256 startTime,
                    uint256 endTime,
                    string[] memory options,
                    uint256[] memory voteCounts,
                ) = pollManager.getPoll(i);

                closedPolls[index] = Poll(id, name, duration, startTime, endTime, false, options, voteCounts);
                index++;
            }
        }

        return closedPolls;
    }


    
}
