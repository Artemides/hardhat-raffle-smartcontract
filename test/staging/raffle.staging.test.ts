import { ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../hardhat.helper.config";
import { Raffle } from "../../typechain-types";
import { BigNumber } from "ethers";
import { assert, expect } from "chai";

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging test", () => {
          let deployer;
          let raffle: Raffle;
          let raffleEntranceFee: BigNumber;
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              raffle = await ethers.getContract("Raffle");
              raffleEntranceFee = await raffle.getEntraceFee();
          });

          describe("fulfillRadndomWords", async () => {
              it("works with vrf and chainlink keepers", async () => {
                  const accounts = await ethers.getSigners();
                  const startingRaffleInterval = await raffle.getLatestRaffleTimeStamp();
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async (winnerAddress) => {
                          try {
                              const raffleStatus = await raffle.getRaffleState();
                              const lastRaffleInterval = await raffle.getLatestRaffleTimeStamp();
                              const winnerBalance = await ethers.provider.getBalance(winnerAddress);

                              assert.equal(winner.address, winnerAddress);
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingWinnerBalance.add(raffleEntranceFee).toString()
                              );
                              assert.equal(raffleStatus, 0);
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert(lastRaffleInterval > startingRaffleInterval);
                              resolve("");
                          } catch (error) {
                              reject(error);
                          }
                      });

                      const tx = await raffle.joinRaffle({ value: raffleEntranceFee });
                      await tx.wait(1);
                      const winner = accounts[0];
                      const startingWinnerBalance = await ethers.provider.getBalance(
                          winner.address
                      );
                  });
              });
          });
      });
