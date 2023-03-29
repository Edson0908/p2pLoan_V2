const { ethers, getNamedAccounts } = require("hardhat")
async function main() {
    const loanManager = await ethers.getContract("LoanManager")
    const id = 0
    const DECIMALS = 18
    const input = await loanManager.getLoanObj(id)

    output = {
        borrower: input[9],
        collateral: {
            category: input[0][0].toString(),
            assetAddress: input[0][1],
            id: input[0][2].toString(),
            amount:
                input[0][0] == 1
                    ? input[0][3].toString()
                    : ethers.utils.formatUnits(input[0][3], DECIMALS),
        },
        loanAsset: {
            category: input[1][0].toString(),
            assetAddress: input[1][1],
            id: input[1][2].toString(),
            amount: ethers.utils.formatUnits(input[1][3], DECIMALS),
        },
        repayAmount: ethers.utils.formatUnits(input[2], DECIMALS),

        duration: input[3].toString(),
        expiration:
            input[4].toNumber() == 0
                ? "NA"
                : new Date(input[4].toNumber() * 1000).toLocaleString(),
        LoanStatus: input[5].toString(),
        collateralFilled: ethers.utils.formatUnits(input[6], DECIMALS),
        deadline:
            input[7].toNumber() == 0
                ? "NA"
                : new Date(input[7].toNumber() * 1000).toLocaleString(),
        dueTime:
            input[8].toNumber() == 0
                ? "NA"
                : new Date(input[8].toNumber() * 1000).toLocaleString(),
    }

    console.log(output)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
