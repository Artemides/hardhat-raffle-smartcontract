import { ethers, network } from "hardhat";
import fs from "fs";
import { Raffle } from "../typechain-types";
type Addresses = {
    [key: string]: string[];
};
const ADDRESS_PATH = "../hardhat-raffle-frontend/constants/addresses.json";
const ABI_PATH = "../hardhat-raffle-frontend/constants/abi.json";
const frontendResources = async () => {
    const raffle: Raffle = await ethers.getContract("Raffle");
    exportABI(raffle);
    exportAddresses(raffle);
};

function exportABI(raffle: Raffle) {
    fs.writeFileSync(
        ABI_PATH,
        JSON.parse(JSON.stringify(raffle.interface.format(ethers.utils.FormatTypes.json)))
    );
}
function exportAddresses(raffe: Raffle) {
    const contractAddresses: Addresses = JSON.parse(fs.readFileSync(ADDRESS_PATH, "utf8"));
    const chainId = network.config.chainId?.toString() ?? "";
    if (!chainId) return;

    const addresses = new Set(contractAddresses[chainId]);
    addresses.add(raffe.address);
    contractAddresses[chainId] = [...addresses];
    fs.writeFileSync(ADDRESS_PATH, JSON.stringify(contractAddresses));
}
{
    ("2222");
}

export default frontendResources;
frontendResources.tags = ["all", "frontend"];
