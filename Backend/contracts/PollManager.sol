// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFTMintBurn.sol";

contract PollManager {
    struct Poll {
        uint256 id;
        string name;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        string[] options;
        uint256[] voteCounts; // Track votes for each option
        address owner;
        mapping(address => uint256) userVote;
        mapping(address => bool) hasVoted;
        mapping(address => bool) hasParticipated;
    }

    uint256 public pollCount = 0;
    mapping(uint256 => Poll) public polls;
    NFTMintBurn private nftContract;
    address constant adminWallet = 0x052f6196e8DaBf9773edEb41D50222dB0701a438;

    //mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => uint256)) private userTokenId; // Mapping to store tokenId for each poll and address

    event PollCreated(uint256 pollId, string name, uint256 duration, uint256 startTime, uint256 endTime, string[] options);
    event Voted(uint256 pollId, address voter, uint256 optionIndex);

    constructor(address _nftContractAddress) {
        nftContract = NFTMintBurn(_nftContractAddress);
    }

    function createPoll(string memory _name, string[] memory _options, uint256 _duration) public {
        require(_options.length >= 2, "Poll must have at least two options.");
        require(_duration > 0, "Poll duration must be positive.");

        pollCount++;

        Poll storage newPoll = polls[pollCount];
        newPoll.id = pollCount;
        newPoll.name = _name;
        newPoll.options = _options;
        newPoll.voteCounts = new uint256[](_options.length); // Initialize voteCounts to 0 for each option
        newPoll.duration = _duration;
        newPoll.startTime = block.timestamp;
        newPoll.endTime = block.timestamp + (_duration * 60);
        newPoll.owner = msg.sender;

        emit PollCreated(pollCount, _name, _duration, newPoll.startTime, newPoll.endTime, _options);
    }

    function participate(uint256 _pollId) public {
        Poll storage poll = polls[_pollId];

        require(block.timestamp < poll.endTime, "Poll has ended.");
        require(!poll.hasParticipated[msg.sender], "You have already participated.");

        // Mint an NFT for the user and associate it with the poll
        uint256 tokenId = nftContract.mintNFT(msg.sender, _pollId);  // Assume mintNFT returns tokenId
        userTokenId[_pollId][msg.sender] = tokenId;  // Store the tokenId for the user in this poll

        poll.hasParticipated[msg.sender] = true;
    }


    function vote(uint256 _pollId, uint256 _optionIndex) public {
        Poll storage poll = polls[_pollId];

        require(block.timestamp < poll.endTime, "Poll has ended.");
        require(!poll.hasVoted[msg.sender], "You have already voted in this poll.");

        uint256 tokenId = userTokenId[_pollId][msg.sender]; // Retrieve the tokenId for this user and poll
        uint256 pollIdAssociatedWithNFT = nftContract.getPollIdForToken(tokenId);
        require(pollIdAssociatedWithNFT == _pollId, "You must hold the NFT associated with this poll.");

        require(_optionIndex < poll.options.length, "Invalid option selected.");

        // Increment the vote count for the selected option
        poll.voteCounts[_optionIndex]++;

        poll.userVote[msg.sender] = _optionIndex;
        poll.hasVoted[msg.sender] = true;

        nftContract.burnNFT(tokenId);

        emit Voted(_pollId, msg.sender, _optionIndex);
    }

    function isPollActive(uint256 _pollId) public view returns (bool) {
        return block.timestamp < polls[_pollId].endTime;
    }

    function closePoll(uint256 _pollId) public {
        Poll storage poll = polls[_pollId];
        
        require(msg.sender == poll.owner || msg.sender == adminWallet, "Only the poll creator or admin can close the poll.");

        polls[_pollId].endTime = block.timestamp;
    }

    function getPollOptions(uint256 _pollId) public view returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getPoll(uint256 _pollId) public view returns (
        uint256 id,
        string memory name,
        uint256 duration,
        uint256 startTime,
        uint256 endTime,
        string[] memory options,
        uint256[] memory voteCounts,
        uint256 timeRemaining
    ) {
        Poll storage poll = polls[_pollId];
        timeRemaining = poll.endTime > block.timestamp ? poll.endTime - block.timestamp : 0;
        return (poll.id, poll.name, poll.duration, poll.startTime, poll.endTime, poll.options, poll.voteCounts, timeRemaining);
    }


    function getUserVote(uint256 _pollId, address _user) public view returns (uint256) {
    Poll storage poll = polls[_pollId];
    require(poll.hasVoted[_user], "User has not voted in this poll.");
    return poll.userVote[_user];
    }


    // New function to get tokenId for a specific poll and user
    function getTokenIdForPoll(uint256 _pollId, address _user) public view returns (uint256) {
        return userTokenId[_pollId][_user];
    }

    // Getter function to retrieve if the user has voted in a poll
    function hasVoted(uint256 _pollId, address _user) public view returns (bool) {
        require(_pollId <= pollCount, "Poll does not exist");
        Poll storage poll = polls[_pollId];
        return poll.hasVoted[_user];
    }

    // Getter function to retrieve if the user has participated in a poll
    function hasParticipated(uint256 _pollId, address _user) public view returns (bool) {
        require(_pollId <= pollCount, "Poll does not exist");
        Poll storage poll = polls[_pollId];
        return poll.hasParticipated[_user];
    }

}
