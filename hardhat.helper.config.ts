export type NetworkConfig = {
    [key: string]: {
        name: string;
        vrfCoordinatorV2: string;
        priceFeedAddress: string;
    };
};
export const networkConfig: NetworkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        priceFeedAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
};

export const developmentChains = ["local", "hardhat"];
