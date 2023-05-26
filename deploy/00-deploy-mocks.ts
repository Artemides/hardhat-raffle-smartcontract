import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains } from "../hardhat.helper.config";
import { ethers, network } from "hardhat";

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

const vrfCoordinatorV2Mock = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;

    const args = [BASE_FEE, GAS_PRICE_LINK];
    if (developmentChains.includes(network.name)) {
        log("Deploying VRFCoordinatorV2Mock...");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args,
            log: true,
        });
        log("VRFCoordinatorV2Mock deployed");
    }
};
export default vrfCoordinatorV2Mock;
vrfCoordinatorV2Mock.tags = ["all", "mocks"];
