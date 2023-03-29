const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        const CollateralToken = await deploy("CollateralToken", {
            from: deployer,
            args: [],
            log: true,
        })

        const LendingToken = await deploy("LendingToken", {
            from: deployer,
            args: [],
            log: true,
        })

        const TestNFT = await deploy("TestNFT", {
            from: deployer,
            args: [],
            log: true,
        })
    }
}

module.exports.tags = ["all", "testToken"]
