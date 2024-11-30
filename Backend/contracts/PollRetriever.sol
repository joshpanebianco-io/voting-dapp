// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PollManager.sol";

contract PollRetriever {
    PollManager public pollManager;

    struct Poll {
        uint256 pollId;
        string pollName;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        bool isActive; // Derived from `isPollActive`
        string[] options;
        uint256[] voteCounts; // Add the vote counts for each option
    }

    // Mappings to track participation and voting status of users
    mapping(uint256 => mapping(address => bool)) public hasParticipated;  // Poll ID -> User Address -> Participation Status
    mapping(uint256 => mapping(address => bool)) public hasVoted; 

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
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                activeCount++;
            }
        }

        Poll[] memory activePolls = new Poll[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            if (pollManager.isPollActive(i)) {
                (
                    uint256 id,
                    string memory name,
                    uint256 duration,
                    uint256 startTime,
                    uint256 endTime,
                    string[] memory options,
                    uint256[] memory voteCounts,
                ) = pollManager.getPoll(i);

                activePolls[index] = Poll(id, name, duration, startTime, endTime, true, options, voteCounts);
                index++;
            }
        }

        return activePolls;
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
