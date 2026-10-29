/**
 * Seeds a local deployment with sample polls in every state (active, ending
 * soon, closed early, closed naturally, tie) so the UI can be explored
 * without creating everything by hand.
 *
 *   npm run node            # terminal 1
 *   npm run deploy:local    # terminal 2
 *   npm run seed:local      # terminal 2
 *
 * Hardhat account #0 (the default MetaMask import for local dev) ends up
 * registered-but-not-voted in one poll and voted in two others.
 */
const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const { ethers, network } = hre;
  const recordPath = path.resolve(__dirname, `../deployments/${network.name}.json`);
  if (!fs.existsSync(recordPath)) {
    throw new Error(`No deployment found for ${network.name}. Run the deploy script first.`);
  }
  const { contracts } = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  const manager = await ethers.getContractAt("PollManager", contracts.PollManager);
  const [a0, a1, a2, a3, a4, a5] = await ethers.getSigners();

  async function create(signer, name, options, minutes) {
    const receipt = await (await manager.connect(signer).createPoll(name, options, minutes)).wait();
    const event = receipt.logs.map((log) => manager.interface.parseLog(log)).find((e) => e && e.name === "PollCreated");
    const id = Number(event.args.pollId);
    console.log(`#${id} ${name}`);
    return id;
  }
  async function vote(signer, pollId, option) {
    await (await manager.connect(signer).participate(pollId)).wait();
    await (await manager.connect(signer).vote(pollId, option)).wait();
  }

  // Closed early by its creator, clear winner, account #0 voted.
  const p1 = await create(a1, "Should we move to a four-day work week?", ["Yes", "No", "Trial it for a quarter"], 60 * 24);
  await vote(a0, p1, 2);
  await vote(a1, p1, 2);
  await vote(a2, p1, 0);
  await vote(a3, p1, 2);
  await vote(a4, p1, 1);
  await vote(a5, p1, 2);
  await (await manager.connect(a1).closePoll(p1)).wait();

  // Active; account #0 registered but has not voted yet.
  const p2 = await create(a0, "Which feature should we build next?", ["Dark mode", "Mobile app", "Public API", "Slack integration"], 60 * 24 * 2);
  await vote(a1, p2, 1);
  await vote(a2, p2, 1);
  await vote(a3, p2, 0);
  await vote(a4, p2, 2);
  await (await manager.connect(a0).participate(p2)).wait();

  // Active; account #0 already voted.
  const p3 = await create(a2, "Where should the 2027 team offsite be?", ["Lisbon", "Kyoto", "Mexico City"], 60 * 24 * 5);
  await vote(a0, p3, 1);
  await vote(a1, p3, 1);
  await vote(a3, p3, 0);

  // Ending soon; account #0 has not taken part.
  const p4 = await create(a3, "Pick the launch date for v2", ["3 March", "10 March", "17 March"], 42);
  await vote(a1, p4, 1);
  await vote(a4, p4, 1);
  await vote(a5, p4, 2);

  // Closed naturally with a tie.
  const p5 = await create(a4, "Coffee or tea for the kitchen?", ["Coffee", "Tea"], 1);
  await vote(a1, p5, 0);
  await vote(a2, p5, 1);
  await network.provider.send("evm_increaseTime", [90]);
  await network.provider.send("evm_mine");

  console.log("\nSeeded 5 polls. Point the frontend at this deployment and connect Hardhat account #0.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
