const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const loanManager = await deploy("LoanManager", {
        from: deployer,
        args: [],
        log: true,
    })
}

module.exports.tags = ["all", "loanManager"]
