import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../hardhat.helper.config";
import { ethers, network } from "hardhat";
import { VRFCoordinatorV2Mock } from "../typechain-types";
import { verify } from "../utils/contract-verify";

const SUB_LINK_FUND = "1000000000000000000000";

const raffle = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId ?? "";
    let vrfCoordinatorV2MockAddress: string;
    let subscriptionId: string;
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address;

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        const { events } = transactionReceipt;
        subscriptionId = events ? events[0].args?.subId : "";
        console.log({ number: subscriptionId });
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, SUB_LINK_FUND);
    } else {
        vrfCoordinatorV2MockAddress = networkConfig[chainId].vrfCoordinatorV2 ?? "";
        subscriptionId = networkConfig[chainId].subId ?? "";
    }
    const { entranceFee, gasLane, callbackGasLimit, raffleInterval } = networkConfig[chainId];
    const args = [
        vrfCoordinatorV2MockAddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        raffleInterval,
    ];

    log("deploying Raffle Contract...");
    const raffle = await deploy("Raffle", {
        from: deployer,
        args,
        log: true,
    });
    log("Raffle deployed");

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying raffle contracy...");
        await verify(raffle.address, args);
    }
};

export default raffle;
raffle.tags = ["all", "raffle"];
