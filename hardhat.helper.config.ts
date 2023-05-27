import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export type NetworkConfig = {
    [key: string]: {
        name: string;
        vrfCoordinatorV2?: string;
        priceFeedAddress?: string;
        entranceFee: BigNumber;
        gasLane: string;
        subId?: string;
        callbackGasLimit: string;
        raffleInterval: string;
    };
};
export const networkConfig: NetworkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        priceFeedAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subId: "0",
        callbackGasLimit: "500000",
        raffleInterval: "60",
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        raffleInterval: "60",
    },
};

export const developmentChains = ["local", "hardhat"];
