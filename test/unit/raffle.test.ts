import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains, networkConfig } from "../../hardhat.helper.config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";
import raffle from "../../deploy/01-deploy-raffle";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", async () => {
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

          describe("constructor", async () => {
              it("Initializes the raffle state as Open", async () => {
                  const raffleSatte = await raffle.getRaffleState();
                  assert.equal(raffleSatte, 0);
              });
          });

          describe("Join Raffle", async () => {
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
      });
