import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../hardhat.helper.config";
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
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
              entranceFee = await raffle.getEntraceFee();
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
                      value: ethers.utils.parseEther(entranceFee.toString()),
                  });
                  const player = await raffle.getPlayer(0);
                  assert.equal(player, deployer);
              });
          });
      });
