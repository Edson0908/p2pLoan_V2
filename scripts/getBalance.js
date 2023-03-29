const { ethers, getNamedAccounts } = require("hardhat")
const fs = require("fs")
const abiFile = "./artifacts/contracts/LoanNft.sol/LoanNft.json"

async function main() {
    const accounts = await getNamedAccounts()

    const borrower = accounts.borrower
    const lender = accounts.lender

    const loanManager = await ethers.getContract("LoanManager")
    const Vault = await loanManager.VAULT()
    const LoanNftAddress = await loanManager.LOAN()
    const LendingToken = await ethers.getContract("LendingToken")
    const CollateralToken = await ethers.getContract("CollateralToken")
    const TestNFT = await ethers.getContract("TestNFT")
    const TestNFTAbi = JSON.parse(fs.readFileSync(abiFile, "utf8")).abi
    const LoanNft = await ethers.getContractAt(TestNFTAbi, LoanNftAddress)

    console.log("------------------------------------------")
    console.log("【Borrower Balance】")
    console.log("------------------------------------------")
    console.log(
        `COL :\t\t${ethers.utils.formatUnits(
            await CollateralToken.balanceOf(borrower),
            18
        )}`
    )
    console.log(
        `LEN :\t\t${ethers.utils.formatUnits(
            await LendingToken.balanceOf(borrower),
            18
        )}`
    )
    console.log(`NFT :\t\t${(await TestNFT.balanceOf(borrower)).toString()}`)
    console.log("------------------------------------------")
    console.log("【Lender Balance】")
    console.log("------------------------------------------")
    console.log(
        `COL :\t\t${ethers.utils.formatUnits(
            await CollateralToken.balanceOf(lender),
            18
        )}`
    )
    console.log(
        `LEN :\t\t${ethers.utils.formatUnits(
            await LendingToken.balanceOf(lender),
            18
        )}`
    )
    console.log(`NFT :\t\t${(await TestNFT.balanceOf(lender)).toString()}`)
    console.log(`LOAN :\t\t${(await LoanNft.balanceOf(lender)).toString()}`)
    console.log("------------------------------------------")
    console.log("【Vault Balance】")
    console.log("------------------------------------------")
    console.log(
        `COL :\t\t${ethers.utils.formatUnits(
            await CollateralToken.balanceOf(Vault),
            18
        )}`
    )
    console.log(
        `LEN :\t\t${ethers.utils.formatUnits(
            await LendingToken.balanceOf(Vault),
            18
        )}`
    )
    console.log(`NFT :\t\t${(await TestNFT.balanceOf(Vault)).toString()}`)
    console.log("------------------------------------------")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
