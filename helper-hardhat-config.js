const networkConfig = {
    5: {
        name: "goerli",
    },
    31337: {
        name: "localhost",
    },
}

const developmentChains = ["hardhat", "localhost"]
const contractDeployedAddress = "./constants/contractAddress.json"
const contractAbiLocation = "./constants/"
const logfile = "./log/log_loanRecords.json"

module.exports = {
    networkConfig,
    developmentChains,
    contractDeployedAddress,
    contractAbiLocation,
    logfile,
}
