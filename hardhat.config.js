require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-ethers")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("@nomicfoundation/hardhat-chai-matchers")
require("dotenv").config()

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
const LENDER_PRIVATE_KEY = process.env.LENDER_PRIVATE_KEY
const BORROWER_PRIVATE_KEY = process.env.BORROWER_PRIVATE_KEY

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            gas: "auto",
            gasPrice: "auto",
            chainId: 31337,
        },
        localhost: {
            // gas: "auto",
            // url: "http://localhost:8545",
            gasPrice: 20000000000,
            chainId: 31337,
        },
        goerli: {
            accounts: [
                DEPLOYER_PRIVATE_KEY,
                LENDER_PRIVATE_KEY,
                BORROWER_PRIVATE_KEY,
            ],
            url: GOERLI_RPC_URL,
            chainId: 5,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas_report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            31337: 0,
            5: 0,
        },
        borrower: {
            default: 1,
            31337: 1,
            5: 1,
        },
        lender: {
            default: 2,
            31337: 2,
            5: 2,
        },
    },
    solidity: "0.8.18",
    // coverage: {
    //     providerOptions: {
    //         url: "http://127.0.0.1:8545",
    //         gasPrice: 20000000000,
    //     },
    // },
}
