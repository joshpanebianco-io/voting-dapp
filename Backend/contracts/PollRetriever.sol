// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PollManager} from "./PollManager.sol";

/**
 * @title PollRetriever
 * @notice Read-only helper that returns whole poll lists in a single call so
 *         the frontend does not have to loop over `pollCount` itself.
 *
 * @dev    The `msg.sender`-based variants are kept for compatibility with the
 *         original deployment; prefer the `...For(address)` variants, which do
 *         not depend on who is making the `eth_call`.
 */
contract PollRetriever {
    PollManager public immutable pollManager;

    struct Poll {
        uint256 id;
        string name;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        string[] options;
        uint256[] voteCounts;
    }

    constructor(address _pollManagerAddress) {
        pollManager = PollManager(_pollManagerAddress);
    }

    function getPoll(uint256 _pollId) public view returns (Poll memory) {
        return _load(_pollId);
    }

    /// @notice Every poll, oldest first.
    function getAllPolls() external view returns (Poll[] memory list) {
        uint256 count = pollManager.pollCount();
        list = new Poll[](count);
        for (uint256 i = 1; i <= count; i++) {
            list[i - 1] = _load(i);
        }
    }

    /// @notice Active polls the caller has not voted in yet.
    function getActivePolls() external view returns (Poll[] memory) {
        return getActivePollsFor(msg.sender);
    }

    /// @notice Active polls `user` has not voted in yet.
    function getActivePollsFor(address user) public view returns (Poll[] memory) {
        uint256 count = pollManager.pollCount();
        bool[] memory keep = new bool[](count + 1);
        uint256 n = 0;
        for (uint256 i = 1; i <= count; i++) {
            if (pollManager.isPollActive(i) && !pollManager.hasVoted(i, user)) {
                keep[i] = true;
                n++;
            }
        }
        return _collect(keep, n);
    }

    /// @notice Polls the caller has voted in (active or closed).
    function getVotedPolls() external view returns (Poll[] memory) {
        return getVotedPollsFor(msg.sender);
    }

    /// @notice Polls `user` has voted in (active or closed).
    function getVotedPollsFor(address user) public view returns (Poll[] memory) {
        uint256 count = pollManager.pollCount();
        bool[] memory keep = new bool[](count + 1);
        uint256 n = 0;
        for (uint256 i = 1; i <= count; i++) {
            if (pollManager.hasVoted(i, user)) {
                keep[i] = true;
                n++;
            }
        }
        return _collect(keep, n);
    }

    /// @notice Polls whose end time has passed.
    function getClosedPolls() external view returns (Poll[] memory) {
        uint256 count = pollManager.pollCount();
        bool[] memory keep = new bool[](count + 1);
        uint256 n = 0;
        for (uint256 i = 1; i <= count; i++) {
            if (!pollManager.isPollActive(i)) {
                keep[i] = true;
                n++;
            }
        }
        return _collect(keep, n);
    }

    // ---------------------------------------------------------------------

    function _collect(bool[] memory keep, uint256 n) private view returns (Poll[] memory list) {
        list = new Poll[](n);
        uint256 idx = 0;
        for (uint256 i = 1; i < keep.length; i++) {
            if (keep[i]) list[idx++] = _load(i);
        }
    }

    function _load(uint256 _pollId) private view returns (Poll memory p) {
        (
            uint256 id,
            string memory name,
            uint256 duration,
            uint256 startTime,
            uint256 endTime,
            string[] memory options,
            uint256[] memory voteCounts,
        ) = pollManager.getPoll(_pollId);

        p.id = id;
        p.name = name;
        p.duration = duration;
        p.startTime = startTime;
        p.endTime = endTime;
        p.isActive = block.timestamp < endTime;
        p.options = options;
        p.voteCounts = voteCounts;
    }
}
