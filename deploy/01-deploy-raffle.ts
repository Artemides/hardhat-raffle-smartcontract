import { HardhatRuntimeEnvironment } from "hardhat/types";

export const raffle = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const deployer = await getNamedAccounts();
};
