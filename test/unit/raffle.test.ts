import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains, networkConfig } from "../../hardhat.helper.config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import raffle from "../../deploy/01-deploy-raffle";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { SupportInfo } from "prettier";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let deployer: string;
          let raffle: Raffle;
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
          let entranceFee: BigNumber;
          let raffleInterval: BigNumber;
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
              entranceFee = await raffle.getEntraceFee();
              raffleInterval = await raffle.getRaffleInterval();
          });

          describe("constructor", () => {
              it("Initializes the raffle state as Open", async () => {
                  const raffleSatte = await raffle.getRaffleState();
                  assert.equal(raffleSatte, 0);
              });
          });

          describe("Join Raffle", () => {
              it("reverts if not sent at least entrance fee", async () => {
                  await expect(raffle.joinRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NoEnoughStartingFee"
                  );
              });

              it("Records the player when he joins", async () => {
                  await raffle.joinRaffle({
                      value: entranceFee,
                  });
                  const player = await raffle.getPlayer(0);
                  assert.equal(player, deployer);
              });
              it("Emits an event when the player joins", async () => {
                  await expect(raffle.joinRaffle({ value: entranceFee }))
                      .to.emit(raffle, "RafflePlayerJoined")
                      .withArgs(deployer);
              });

              it("Reverts the joining if the raffle is not open", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);

                  await raffle.performUpkeep([]);
                  await expect(
                      raffle.joinRaffle({ value: entranceFee })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen");
              });
          });

          describe("checkUpKeep", () => {
              it("returns false if raffle is not open", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });

                  await raffle.performUpkeep([]);
                  const raffleState = await raffle.getRaffleState();
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert.equal(raffleState, 1);
                  assert(!upkeepNeeded);
              });

              it("returns false if there's no participants or ETH", async () => {
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert(!upkeepNeeded);
              });

              it("returns false if the raffle interval has not been reached", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() - 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");

                  assert(!upkeepNeeded);
              });
              it("returns true if there is players, balance and raffle interval has been reached", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });

                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");

                  assert(upkeepNeeded);
              });
          });

          describe("Perform upkeep", () => {
              it("Runs only if upkeep is needed", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const transaction = await raffle.performUpkeep("0x");
                  assert(transaction);
              });

              it("Reverts if checkUpKeep is false", async () => {
                  await expect(raffle.performUpkeep([])).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NoIntervalReachedToWin"
                  );
              });

              it("Updates raffle's state and emits the winner event", async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);

                  const transaction = await raffle.performUpkeep("0x");
                  const transactionReceipt = await transaction.wait(1);
                  const { events } = transactionReceipt;
                  const requestId = events ? events[1].args?.requestId : "";
                  const raffleState = await raffle.getRaffleState();
                  assert(requestId.toNumber() > 0);
                  assert(raffleState == 1);
              });
          });

          describe("fulfill random words", () => {
              beforeEach(async () => {
                  await raffle.joinRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
              });

              it("Gets called only after the perform upkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request");
              });

              it("Picks a winner, transfers the raffle balance to the winner and resets the raffle", async () => {
                  //declare aditional accounts
                  //make them participant of the raffle
                  //subscripte the emitted envent by the fulfill
                  //1. determine the winner
                  //2. assert the restored states for the next raffle interval
                  //3. transfer the monet
                  //call the vrfFullfill function
                  let accounts = await ethers.getSigners();
                  const aditionalParticipants = 5;
                  accounts = accounts.slice(1, aditionalParticipants);

                  await Promise.all(
                      accounts.map(async (account) => {
                          raffle = raffle.connect(account);
                          await raffle.joinRaffle({ value: entranceFee });
                      })
                  );

                  await new Promise(async (resolve, reject) => {
                      try {
                          raffle.once("WinnerPicked", async (winnerAddress: string) => {
                              console.log("winner picked");
                              const winnerBalance = await ethers.provider.getBalance(winnerAddress);
                              const raffleState = await raffle.getRaffleState();
                              const players = await raffle.getNumberOfPlayers();

                              assert(raffleState.toString(), "0");
                              assert(players.toString(), "0");
                              console.log({ winnerBalance: winnerBalance.toNumber() });
                              console.log({
                                  balance: startingWinnerBalance
                                      .add(entranceFee.mul(aditionalParticipants + 1))
                                      .toString(),
                              });
                              assert(
                                  winnerBalance.toString(),
                                  startingWinnerBalance
                                      .add(entranceFee.mul(aditionalParticipants + 1))
                                      .toString()
                              );
                          });
                          resolve("");
                      } catch (error) {
                          reject(error);
                      }

                      const tx = await raffle.performUpkeep("0x");
                      const { events } = await tx.wait(1);
                      const startingWinnerBalance = await ethers.provider.getBalance(
                          accounts[3].address
                      );
                      const rqeuestId = events ? events[1].args?.requestId : "";
                      await vrfCoordinatorV2Mock.fulfillRandomWords(rqeuestId, raffle.address);
                  });
              });
          });
      });
