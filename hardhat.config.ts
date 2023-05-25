import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "dotenv/config";
const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.0",
            },
            {
                version: "0.8.18",
            },
        ],
    },
};

export default config;
