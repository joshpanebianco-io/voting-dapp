const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const MINUTE = 60;

async function deployFixture() {
  const [admin, alice, bob, carol] = await ethers.getSigners();

  const PollManager = await ethers.getContractFactory("PollManager");
  const manager = await PollManager.deploy();
  await manager.waitForDeployment();

  const ballot = await ethers.getContractAt("BallotNFT", await manager.ballot());

  const PollRetriever = await ethers.getContractFactory("PollRetriever");
  const retriever = await PollRetriever.deploy(await manager.getAddress());
  await retriever.waitForDeployment();

  return { manager, ballot, retriever, admin, alice, bob, carol };
}

async function createPoll(manager, signer, overrides = {}) {
  const { name = "Favourite colour?", options = ["Red", "Green", "Blue"], duration = 60 } = overrides;
  const tx = await manager.connect(signer).createPoll(name, options, duration);
  const receipt = await tx.wait();
  const event = receipt.logs.map((log) => manager.interface.parseLog(log)).find((e) => e && e.name === "PollCreated");
  return { pollId: event.args.pollId, receipt };
}

describe("PollManager", function () {
  describe("deployment", function () {
    it("deploys its own BallotNFT and records the admin", async function () {
      const { manager, ballot, admin } = await loadFixture(deployFixture);
      expect(await manager.admin()).to.equal(admin.address);
      expect(await ballot.pollManager()).to.equal(await manager.getAddress());
      expect(await ballot.name()).to.equal("DecentraVote Ballot");
      expect(await manager.pollCount()).to.equal(0n);
    });
  });

  describe("createPoll", function () {
    it("stores the poll and emits PollCreated", async function () {
      const { manager, alice } = await loadFixture(deployFixture);
      const tx = await manager.connect(alice).createPoll("Lunch?", ["Pizza", "Sushi"], 30);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(manager, "PollCreated")
        .withArgs(1n, "Lunch?", 30n, block.timestamp, block.timestamp + 30 * MINUTE, ["Pizza", "Sushi"]);

      expect(await manager.pollCount()).to.equal(1n);
      const poll = await manager.getPoll(1);
      expect(poll.id).to.equal(1n);
      expect(poll.name).to.equal("Lunch?");
      expect(poll.options).to.deep.equal(["Pizza", "Sushi"]);
      expect(poll.voteCounts).to.deep.equal([0n, 0n]);
      expect(poll.timeRemaining).to.equal(30n * BigInt(MINUTE));

      const stored = await manager.polls(1);
      expect(stored.owner).to.equal(alice.address);
      expect(await manager.isPollActive(1)).to.equal(true);
    });

    it("returns the new poll id", async function () {
      const { manager, alice } = await loadFixture(deployFixture);
      await createPoll(manager, alice);
      expect(await manager.connect(alice).createPoll.staticCall("Second", ["A", "B"], 5)).to.equal(2n);
    });

    it("rejects invalid input", async function () {
      const { manager, alice } = await loadFixture(deployFixture);
      const m = manager.connect(alice);

      await expect(m.createPoll("", ["A", "B"], 5)).to.be.revertedWithCustomError(manager, "InvalidName");
      await expect(m.createPoll("x".repeat(121), ["A", "B"], 5)).to.be.revertedWithCustomError(manager, "InvalidName");
      await expect(m.createPoll("Q", ["A"], 5)).to.be.revertedWithCustomError(manager, "InvalidOptionCount").withArgs(1);
      await expect(m.createPoll("Q", Array.from({ length: 11 }, (_, i) => `O${i}`), 5))
        .to.be.revertedWithCustomError(manager, "InvalidOptionCount")
        .withArgs(11);
      await expect(m.createPoll("Q", ["A", ""], 5)).to.be.revertedWithCustomError(manager, "InvalidOptionText").withArgs(1);
      await expect(m.createPoll("Q", ["A", "y".repeat(81)], 5))
        .to.be.revertedWithCustomError(manager, "InvalidOptionText")
        .withArgs(1);
      await expect(m.createPoll("Q", ["A", "B", "A"], 5)).to.be.revertedWithCustomError(manager, "DuplicateOption").withArgs(2);
      await expect(m.createPoll("Q", ["A", "B"], 0)).to.be.revertedWithCustomError(manager, "InvalidDuration").withArgs(0);
      await expect(m.createPoll("Q", ["A", "B"], 525601)).to.be.revertedWithCustomError(manager, "InvalidDuration");
    });
  });

  describe("participate", function () {
    it("issues a soulbound ballot and marks the voter as registered", async function () {
      const { manager, ballot, alice, bob } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice);

      await expect(manager.connect(bob).participate(pollId))
        .to.emit(manager, "Participated")
        .withArgs(pollId, bob.address, 1n)
        .and.to.emit(ballot, "BallotIssued")
        .withArgs(1n, pollId, bob.address);

      expect(await manager.hasParticipated(pollId, bob.address)).to.equal(true);
      expect(await manager.hasVoted(pollId, bob.address)).to.equal(false);
      expect(await manager.getTokenIdForPoll(pollId, bob.address)).to.equal(1n);
      expect(await ballot.balanceOf(bob.address)).to.equal(1n);
      expect(await ballot.ownerOf(1)).to.equal(bob.address);
      expect(await ballot.pollOf(1)).to.equal(pollId);
      expect(await ballot.totalIssued()).to.equal(1n);
    });

    it("rejects double registration, unknown polls and ended polls", async function () {
      const { manager, alice, bob } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice, { duration: 1 });

      await manager.connect(bob).participate(pollId);
      await expect(manager.connect(bob).participate(pollId))
        .to.be.revertedWithCustomError(manager, "AlreadyRegistered")
        .withArgs(pollId, bob.address);

      await expect(manager.connect(bob).participate(99)).to.be.revertedWithCustomError(manager, "PollNotFound").withArgs(99);
      await expect(manager.connect(bob).participate(0)).to.be.revertedWithCustomError(manager, "PollNotFound").withArgs(0);

      await time.increase(MINUTE);
      await expect(manager.connect(alice).participate(pollId)).to.be.revertedWithCustomError(manager, "PollEnded").withArgs(pollId);
    });
  });

  describe("vote", function () {
    it("counts the vote, records the choice and burns the ballot", async function () {
      const { manager, ballot, alice, bob } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice);
      await manager.connect(bob).participate(pollId);

      await expect(manager.connect(bob).vote(pollId, 2))
        .to.emit(manager, "Voted")
        .withArgs(pollId, bob.address, 2n)
        .and.to.emit(ballot, "BallotSpent")
        .withArgs(1n, pollId, bob.address);

      const poll = await manager.getPoll(pollId);
      expect(poll.voteCounts).to.deep.equal([0n, 0n, 1n]);
      expect(await manager.hasVoted(pollId, bob.address)).to.equal(true);
      expect(await manager.getUserVote(pollId, bob.address)).to.equal(2n);
      expect(await ballot.balanceOf(bob.address)).to.equal(0n);
      expect(await ballot.exists(1)).to.equal(false);
      await expect(ballot.ownerOf(1)).to.be.revertedWithCustomError(ballot, "ERC721NonexistentToken");

      const [participated, voted, votedOption, tokenId] = await manager.getVoterStatus(pollId, bob.address);
      expect(participated).to.equal(true);
      expect(voted).to.equal(true);
      expect(votedOption).to.equal(2n);
      expect(tokenId).to.equal(1n);
    });

    it("requires registration (regression: old contract let token id 0 holders vote anywhere)", async function () {
      const { manager, alice, bob, carol } = await loadFixture(deployFixture);
      const { pollId: first } = await createPoll(manager, alice);
      const { pollId: second } = await createPoll(manager, alice, { name: "Another" });

      // Carol registers for poll 1 only.
      await manager.connect(carol).participate(first);

      // Bob never registered for anything.
      await expect(manager.connect(bob).vote(first, 0))
        .to.be.revertedWithCustomError(manager, "NotRegistered")
        .withArgs(first, bob.address);

      // Carol cannot use her poll-1 ballot in poll 2.
      await expect(manager.connect(carol).vote(second, 0))
        .to.be.revertedWithCustomError(manager, "NotRegistered")
        .withArgs(second, carol.address);
    });

    it("rejects double votes, invalid options and ended polls", async function () {
      const { manager, alice, bob } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice, { duration: 2 });
      await manager.connect(bob).participate(pollId);

      await expect(manager.connect(bob).vote(pollId, 3)).to.be.revertedWithCustomError(manager, "InvalidOption").withArgs(pollId, 3);

      await manager.connect(bob).vote(pollId, 1);
      await expect(manager.connect(bob).vote(pollId, 1))
        .to.be.revertedWithCustomError(manager, "AlreadyVoted")
        .withArgs(pollId, bob.address);

      await manager.connect(alice).participate(pollId);
      await time.increase(2 * MINUTE);
      await expect(manager.connect(alice).vote(pollId, 0)).to.be.revertedWithCustomError(manager, "PollEnded").withArgs(pollId);
    });

    it("getUserVote reverts for an address that has not voted", async function () {
      const { manager, alice, bob } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice);
      await expect(manager.getUserVote(pollId, bob.address)).to.be.revertedWithCustomError(manager, "NotVoted");
    });
  });

  describe("closePoll", function () {
    it("lets the creator or the admin close early, nobody else", async function () {
      const { manager, admin, alice, bob } = await loadFixture(deployFixture);
      const { pollId: p1 } = await createPoll(manager, alice);
      const { pollId: p2 } = await createPoll(manager, alice);

      await expect(manager.connect(bob).closePoll(p1)).to.be.revertedWithCustomError(manager, "NotAuthorized").withArgs(p1, bob.address);

      await expect(manager.connect(alice).closePoll(p1)).to.emit(manager, "PollClosed");
      expect(await manager.isPollActive(p1)).to.equal(false);
      await expect(manager.connect(bob).participate(p1)).to.be.revertedWithCustomError(manager, "PollEnded");

      await expect(manager.connect(admin).closePoll(p2)).to.emit(manager, "PollClosed");
      expect(await manager.isPollActive(p2)).to.equal(false);

      await expect(manager.connect(alice).closePoll(p1)).to.be.revertedWithCustomError(manager, "PollEnded");
    });
  });

  describe("views", function () {
    it("isPollActive is false for unknown ids and getPoll reverts", async function () {
      const { manager } = await loadFixture(deployFixture);
      expect(await manager.isPollActive(0)).to.equal(false);
      expect(await manager.isPollActive(7)).to.equal(false);
      await expect(manager.getPoll(7)).to.be.revertedWithCustomError(manager, "PollNotFound");
      await expect(manager.hasVoted(7, ethers.ZeroAddress)).to.be.revertedWithCustomError(manager, "PollNotFound");
    });

    it("timeRemaining counts down to zero", async function () {
      const { manager, alice } = await loadFixture(deployFixture);
      const { pollId } = await createPoll(manager, alice, { duration: 5 });
      await time.increase(2 * MINUTE);
      const mid = await manager.getPoll(pollId);
      expect(mid.timeRemaining).to.be.closeTo(3n * BigInt(MINUTE), 2n);
      await time.increase(10 * MINUTE);
      const done = await manager.getPoll(pollId);
      expect(done.timeRemaining).to.equal(0n);
    });
  });
});

describe("BallotNFT", function () {
  it("cannot be transferred or approved", async function () {
    const { manager, ballot, alice, bob, carol } = await loadFixture(deployFixture);
    const { pollId } = await createPoll(manager, alice);
    await manager.connect(bob).participate(pollId);

    await expect(ballot.connect(bob).transferFrom(bob.address, carol.address, 1)).to.be.revertedWithCustomError(ballot, "NonTransferable");
    await expect(ballot.connect(bob)["safeTransferFrom(address,address,uint256)"](bob.address, carol.address, 1)).to.be.revertedWithCustomError(
      ballot,
      "NonTransferable",
    );
    await expect(ballot.connect(bob).approve(carol.address, 1)).to.be.revertedWithCustomError(ballot, "NonTransferable");
    await expect(ballot.connect(bob).setApprovalForAll(carol.address, true)).to.be.revertedWithCustomError(ballot, "NonTransferable");
    expect(await ballot.ownerOf(1)).to.equal(bob.address);
  });

  it("can only be minted and burned by the PollManager", async function () {
    const { manager, ballot, alice, bob } = await loadFixture(deployFixture);
    const { pollId } = await createPoll(manager, alice);
    await manager.connect(bob).participate(pollId);

    await expect(ballot.connect(bob).mint(bob.address, pollId)).to.be.revertedWithCustomError(ballot, "OnlyPollManager");
    await expect(ballot.connect(alice).burn(1)).to.be.revertedWithCustomError(ballot, "OnlyPollManager");
    await expect(ballot.connect(bob).burn(1)).to.be.revertedWithCustomError(ballot, "OnlyPollManager");
  });

  it("token ids start at 1 so 0 can mean 'no ballot'", async function () {
    const { manager, alice, bob } = await loadFixture(deployFixture);
    const { pollId } = await createPoll(manager, alice);
    expect(await manager.getTokenIdForPoll(pollId, bob.address)).to.equal(0n);
    await manager.connect(bob).participate(pollId);
    expect(await manager.getTokenIdForPoll(pollId, bob.address)).to.equal(1n);
  });
});

describe("PollRetriever", function () {
  it("splits polls into active and closed and marks isActive correctly", async function () {
    const { manager, retriever, alice } = await loadFixture(deployFixture);
    await createPoll(manager, alice, { name: "Short", duration: 1 });
    await createPoll(manager, alice, { name: "Long", duration: 60 });

    let active = await retriever.getActivePolls();
    let closed = await retriever.getClosedPolls();
    expect(active.map((p) => p.name)).to.deep.equal(["Short", "Long"]);
    expect(closed).to.have.length(0);

    await time.increase(2 * MINUTE);
    active = await retriever.getActivePolls();
    closed = await retriever.getClosedPolls();
    expect(active.map((p) => p.name)).to.deep.equal(["Long"]);
    expect(closed.map((p) => p.name)).to.deep.equal(["Short"]);
    expect(closed[0].isActive).to.equal(false);
    expect(active[0].isActive).to.equal(true);

    const all = await retriever.getAllPolls();
    expect(all.map((p) => Number(p.id))).to.deep.equal([1, 2]);
  });

  it("filters by voter with the ...For(address) variants", async function () {
    const { manager, retriever, alice, bob } = await loadFixture(deployFixture);
    const { pollId: p1 } = await createPoll(manager, alice, { name: "One" });
    await createPoll(manager, alice, { name: "Two" });

    await manager.connect(bob).participate(p1);
    await manager.connect(bob).vote(p1, 0);

    const activeForBob = await retriever.getActivePollsFor(bob.address);
    expect(activeForBob.map((p) => p.name)).to.deep.equal(["Two"]);

    const votedByBob = await retriever.getVotedPollsFor(bob.address);
    expect(votedByBob.map((p) => p.name)).to.deep.equal(["One"]);
    expect(votedByBob[0].voteCounts).to.deep.equal([1n, 0n, 0n]);
    expect(votedByBob[0].isActive).to.equal(true);

    // msg.sender based variants behave the same when called by that account
    const legacy = await retriever.connect(bob).getActivePolls();
    expect(legacy.map((p) => p.name)).to.deep.equal(["Two"]);

    // and the zero address (plain eth_call) sees everything
    const everyone = await retriever.getActivePollsFor(ethers.ZeroAddress);
    expect(everyone).to.have.length(2);
  });

  it("getPoll returns a single poll view", async function () {
    const { manager, retriever, alice } = await loadFixture(deployFixture);
    const { pollId } = await createPoll(manager, alice);
    const poll = await retriever.getPoll(pollId);
    expect(poll.name).to.equal("Favourite colour?");
    expect(poll.options).to.deep.equal(["Red", "Green", "Blue"]);
    expect(poll.isActive).to.equal(true);
  });
});
