// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BallotNFT} from "./BallotNFT.sol";

/**
 * @title PollManager
 * @notice Creates polls and runs a two-step voting flow:
 *
 *         1. `participate(pollId)` registers the caller for a poll and issues
 *            them a soulbound {BallotNFT}.
 *         2. `vote(pollId, optionIndex)` records the caller's choice and burns
 *            their ballot, so each registered voter votes exactly once.
 *
 *         Polls close automatically when their end time passes, or early when
 *         the creator (or the deployer acting as admin) calls `closePoll`.
 *
 * @dev    External function signatures used by the frontend are kept identical
 *         to the original deployment so the same UI works against both.
 */
contract PollManager {
    struct Poll {
        uint256 id;
        string name;
        uint256 duration; // in minutes
        uint256 startTime;
        uint256 endTime;
        string[] options;
        uint256[] voteCounts;
        address owner;
        mapping(address => uint256) userVote;
        mapping(address => bool) hasVoted;
        mapping(address => bool) hasParticipated;
    }

    uint256 public constant MIN_OPTIONS = 2;
    uint256 public constant MAX_OPTIONS = 10;
    uint256 public constant MAX_NAME_BYTES = 120;
    uint256 public constant MAX_OPTION_BYTES = 80;
    uint256 public constant MIN_DURATION_MINUTES = 1;
    uint256 public constant MAX_DURATION_MINUTES = 365 days / 1 minutes;

    uint256 public pollCount;
    mapping(uint256 => Poll) public polls;

    /// @notice The ballot credential contract, deployed and controlled by this contract.
    BallotNFT public immutable ballot;

    /// @notice Deployer; may close any poll early (e.g. to remove abusive content).
    address public immutable admin;

    /// @dev pollId => voter => ballot token id issued to them (0 = none).
    mapping(uint256 => mapping(address => uint256)) private userTokenId;

    event PollCreated(
        uint256 indexed pollId,
        string name,
        uint256 duration,
        uint256 startTime,
        uint256 endTime,
        string[] options
    );
    event Participated(uint256 indexed pollId, address indexed voter, uint256 tokenId);
    event Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollClosed(uint256 indexed pollId, address indexed closedBy, uint256 closedAt);

    error PollNotFound(uint256 pollId);
    error PollEnded(uint256 pollId);
    error AlreadyRegistered(uint256 pollId, address voter);
    error NotRegistered(uint256 pollId, address voter);
    error AlreadyVoted(uint256 pollId, address voter);
    error NotVoted(uint256 pollId, address voter);
    error InvalidOption(uint256 pollId, uint256 optionIndex);
    error NotAuthorized(uint256 pollId, address caller);
    error InvalidName();
    error InvalidOptionCount(uint256 count);
    error InvalidOptionText(uint256 index);
    error DuplicateOption(uint256 index);
    error InvalidDuration(uint256 durationMinutes);

    modifier pollExists(uint256 pollId) {
        if (pollId == 0 || pollId > pollCount) revert PollNotFound(pollId);
        _;
    }

    constructor() {
        ballot = new BallotNFT(address(this));
        admin = msg.sender;
    }

    // ---------------------------------------------------------------------
    // Poll lifecycle
    // ---------------------------------------------------------------------

    /**
     * @notice Create a poll.
     * @param _name      Poll title (1..120 bytes).
     * @param _options   Between 2 and 10 distinct, non-empty options (each <= 80 bytes).
     * @param _duration  Poll length in minutes (1 minute .. 365 days).
     */
    function createPoll(string memory _name, string[] memory _options, uint256 _duration)
        public
        returns (uint256 pollId)
    {
        uint256 nameLen = bytes(_name).length;
        if (nameLen == 0 || nameLen > MAX_NAME_BYTES) revert InvalidName();
        if (_options.length < MIN_OPTIONS || _options.length > MAX_OPTIONS) {
            revert InvalidOptionCount(_options.length);
        }
        if (_duration < MIN_DURATION_MINUTES || _duration > MAX_DURATION_MINUTES) {
            revert InvalidDuration(_duration);
        }

        for (uint256 i = 0; i < _options.length; i++) {
            uint256 len = bytes(_options[i]).length;
            if (len == 0 || len > MAX_OPTION_BYTES) revert InvalidOptionText(i);
            bytes32 hash = keccak256(bytes(_options[i]));
            for (uint256 j = 0; j < i; j++) {
                if (keccak256(bytes(_options[j])) == hash) revert DuplicateOption(i);
            }
        }

        pollId = ++pollCount;

        Poll storage p = polls[pollId];
        p.id = pollId;
        p.name = _name;
        p.options = _options;
        p.voteCounts = new uint256[](_options.length);
        p.duration = _duration;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + (_duration * 1 minutes);
        p.owner = msg.sender;

        emit PollCreated(pollId, _name, _duration, p.startTime, p.endTime, _options);
    }

    /// @notice Register to vote in a poll. Issues a soulbound ballot NFT to the caller.
    function participate(uint256 _pollId) public pollExists(_pollId) {
        Poll storage p = polls[_pollId];
        if (block.timestamp >= p.endTime) revert PollEnded(_pollId);
        if (p.hasParticipated[msg.sender]) revert AlreadyRegistered(_pollId, msg.sender);

        p.hasParticipated[msg.sender] = true;
        uint256 tokenId = ballot.mint(msg.sender, _pollId);
        userTokenId[_pollId][msg.sender] = tokenId;

        emit Participated(_pollId, msg.sender, tokenId);
    }

    /// @notice Cast a vote. Requires a ballot for this poll, which is burned on success.
    function vote(uint256 _pollId, uint256 _optionIndex) public pollExists(_pollId) {
        Poll storage p = polls[_pollId];
        if (block.timestamp >= p.endTime) revert PollEnded(_pollId);
        if (!p.hasParticipated[msg.sender]) revert NotRegistered(_pollId, msg.sender);
        if (p.hasVoted[msg.sender]) revert AlreadyVoted(_pollId, msg.sender);
        if (_optionIndex >= p.options.length) revert InvalidOption(_pollId, _optionIndex);

        p.voteCounts[_optionIndex] += 1;
        p.userVote[msg.sender] = _optionIndex;
        p.hasVoted[msg.sender] = true;

        ballot.burn(userTokenId[_pollId][msg.sender]);

        emit Voted(_pollId, msg.sender, _optionIndex);
    }

    /// @notice End a poll early. Only the poll creator or the admin may do this.
    function closePoll(uint256 _pollId) public pollExists(_pollId) {
        Poll storage p = polls[_pollId];
        if (msg.sender != p.owner && msg.sender != admin) revert NotAuthorized(_pollId, msg.sender);
        if (block.timestamp >= p.endTime) revert PollEnded(_pollId);

        p.endTime = block.timestamp;
        emit PollClosed(_pollId, msg.sender, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function isPollActive(uint256 _pollId) public view returns (bool) {
        if (_pollId == 0 || _pollId > pollCount) return false;
        return block.timestamp < polls[_pollId].endTime;
    }

    function getPollOptions(uint256 _pollId) public view pollExists(_pollId) returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getPoll(uint256 _pollId)
        public
        view
        pollExists(_pollId)
        returns (
            uint256 id,
            string memory name,
            uint256 duration,
            uint256 startTime,
            uint256 endTime,
            string[] memory options,
            uint256[] memory voteCounts,
            uint256 timeRemaining
        )
    {
        Poll storage p = polls[_pollId];
        timeRemaining = p.endTime > block.timestamp ? p.endTime - block.timestamp : 0;
        return (p.id, p.name, p.duration, p.startTime, p.endTime, p.options, p.voteCounts, timeRemaining);
    }

    /// @notice The option index `_user` voted for. Reverts if they have not voted.
    function getUserVote(uint256 _pollId, address _user) public view pollExists(_pollId) returns (uint256) {
        Poll storage p = polls[_pollId];
        if (!p.hasVoted[_user]) revert NotVoted(_pollId, _user);
        return p.userVote[_user];
    }

    /// @notice Ballot token id issued to `_user` for `_pollId` (0 if none). Stays set after the ballot is spent.
    function getTokenIdForPoll(uint256 _pollId, address _user) public view returns (uint256) {
        return userTokenId[_pollId][_user];
    }

    function hasVoted(uint256 _pollId, address _user) public view pollExists(_pollId) returns (bool) {
        return polls[_pollId].hasVoted[_user];
    }

    function hasParticipated(uint256 _pollId, address _user) public view pollExists(_pollId) returns (bool) {
        return polls[_pollId].hasParticipated[_user];
    }

    /// @notice Everything the UI needs about one voter's relationship to one poll, in a single call.
    function getVoterStatus(uint256 _pollId, address _user)
        external
        view
        pollExists(_pollId)
        returns (bool participated, bool voted, uint256 votedOption, uint256 ballotTokenId)
    {
        Poll storage p = polls[_pollId];
        participated = p.hasParticipated[_user];
        voted = p.hasVoted[_user];
        votedOption = voted ? p.userVote[_user] : type(uint256).max;
        ballotTokenId = userTokenId[_pollId][_user];
    }
}
