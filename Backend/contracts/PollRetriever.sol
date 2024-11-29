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
        uint256 endTime;   // Include endTime
        bool isActive;
        string[] options;
    }

    constructor(address _pollManagerAddress) {
        pollManager = PollManager(_pollManagerAddress);
    }

    function getPoll(uint256 _pollId) public view returns (Poll memory) {
        (
            uint256 pollId, 
            string memory pollName, 
            uint256 duration, 
            uint256 startTime, 
            uint256 endTime, 
            bool isActive, 
            string[] memory options
        ) = pollManager.getPoll(_pollId);

        return Poll(pollId, pollName, duration, startTime, endTime, isActive, options);
    }

    function getActivePolls() public view returns (Poll[] memory) {
        uint256 activePollCount = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            (, , , , uint256 endTime, bool isActive,) = pollManager.getPoll(i);
            if (block.timestamp < endTime && isActive) {
                activePollCount++;
            }
        }

        Poll[] memory activePolls = new Poll[](activePollCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            (uint256 pollId, string memory pollName, uint256 duration, uint256 startTime, uint256 endTime, bool isActive, string[] memory options) = pollManager.getPoll(i);
            if (block.timestamp < endTime && isActive) {
                activePolls[index] = Poll(pollId, pollName, duration, startTime, endTime, isActive, options);
                index++;
            }
        }

        return activePolls;
    }

    function getClosedPolls() public view returns (Poll[] memory) {
        uint256 closedPollCount = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            (, , , , uint256 endTime, bool isActive,) = pollManager.getPoll(i);
            if (block.timestamp > endTime || !isActive) {
                closedPollCount++;
            }
        }

        Poll[] memory closedPolls = new Poll[](closedPollCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= pollManager.pollCount(); i++) {
            (uint256 pollId, string memory pollName, uint256 duration, uint256 startTime, uint256 endTime, bool isActive, string[] memory options) = pollManager.getPoll(i);
            if (block.timestamp > endTime || !isActive) {
                closedPolls[index] = Poll(pollId, pollName, duration, startTime, endTime, isActive, options);
                index++;
            }
        }

        return closedPolls;
    }
}
