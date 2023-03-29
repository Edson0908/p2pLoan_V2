const {
    contractDeployedAddress,
    contractAbiLocation,
    logfile,
} = require("../helper-hardhat-config")

const { network } = require("hardhat")
const fs = require("fs")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("update contract info...")
        await updateContractAddresses()
        await updateAbi()
    }
    videLogFile()
}

function videLogFile() {
    fs.writeFileSync(logfile, "{}", (err) => {
        console.log(err)
        return
    })
}

async function updateAbi() {
    const loanManager = await ethers.getContract("LoanManager")
    fs.writeFileSync(
        `${contractAbiLocation}LoanManager.json`,
        loanManager.interface.format(ethers.utils.FormatTypes.json)
    )
}
async function updateContractAddresses() {
    const chainId = network.config.chainId.toString()
    const CollateralToken = await ethers.getContract("CollateralToken")
    const LendingToken = await ethers.getContract("LendingToken")
    const TestNFT = await ethers.getContract("TestNFT")
    const loanManager = await ethers.getContract("LoanManager")

    const contractAddresses = JSON.parse(
        fs.readFileSync(contractDeployedAddress, "utf8")
    )

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["CollateralToken"]) {
            contractAddresses[chainId]["CollateralToken"] = []
        }
        if (
            !contractAddresses[chainId]["CollateralToken"].includes(
                CollateralToken.address
            )
        ) {
            contractAddresses[chainId]["CollateralToken"].push(
                CollateralToken.address
            )
        }
        if (!contractAddresses[chainId]["LendingToken"]) {
            contractAddresses[chainId]["LendingToken"] = []
        }
        if (
            !contractAddresses[chainId]["LendingToken"].includes(
                LendingToken.address
            )
        ) {
            contractAddresses[chainId]["LendingToken"].push(
                LendingToken.address
            )
        }
        if (!contractAddresses[chainId]["TestNFT"]) {
            contractAddresses[chainId]["TestNFT"] = []
        }
        if (!contractAddresses[chainId]["TestNFT"].includes(TestNFT.address)) {
            contractAddresses[chainId]["TestNFT"].push(TestNFT.address)
        }
        if (!contractAddresses[chainId]["LoanManager"]) {
            contractAddresses[chainId]["LoanManager"] = []
        }
        if (
            !contractAddresses[chainId]["LoanManager"].includes(
                loanManager.address
            )
        ) {
            contractAddresses[chainId]["LoanManager"].push(loanManager.address)
        }
    } else {
        contractAddresses[chainId] = {
            CollateralToken: [CollateralToken.address],
            LendingToken: [LendingToken.address],
            TestNFT: [TestNFT.address],
            LoanManager: [loanManager.address],
        }
    }
    fs.writeFileSync(contractDeployedAddress, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "updateContract"]
