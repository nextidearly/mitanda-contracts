import { HardhatUserConfig } from "hardhat/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "solidity-coverage";
// import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
// import "hardhat-spdx-license-identifier";
import "hardhat-tracer";
import "solidity-docgen";

const config = require("./config.js");

module.exports = {
    networks: {
        hardhat: {
            forking: {
                enabled: true,
                url: "https://base-mainnet.diamondswap.org/rpc",
            },
        },
        "ethereum-mainnet": {
            url: "https://eth.llamarpc.com",
            chainId: 1,
            accounts: config.mainnetAccounts,
            gasPrice: 100000000,
        },
        "ethereum-testnet": {
            chainId: 5,
            url: "https://rpc.ankr.com/eth_goerli",
            accounts: config.mainnetAccounts,
            gasPrice: 2000000000,
        },
        "pulse-mainnet": {
            url: "https://rpc.pulsechain.com",
            chainId: 369,
            accounts: config.mainnetAccounts,
            gasPrice: 900000 * 1000000000,
        },
        "pulse-testnet": {
            chainId: 943,
            url: "https://rpc.v4.testnet.pulsechain.com",
            accounts: config.testnetAccounts,
            gasPrice: 1000000000,
        },
        "bsc-testnet": {
            url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: config.testnetAccounts,
        },
        "bsc-mainnet": {
            url: "https://bsc-dataseed.bnbchain.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: config.mainnetAccounts,
        },
        "base-mainnet": {
            url: "https://mainnet.base.org",
            accounts: config.mainnetAccounts,
            gasPrice: 1000000000,
        },
        // for testnet
        "base-sepolia": {
            url: "https://sepolia.base.org",
            accounts: config.mainnetAccounts,
            gasPrice: 1000000000,
        },
        "base-devnet": {
            url: "https://rpc.vnet.tenderly.co/devnet/base-devnet/b209b556-47d7-4727-a935-aad569bc879c",
            accounts: config.mainnetAccounts,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },
    },
    etherscan: {
        apiKey: {
            "base-sepolia": config.apiKeyBase,
        },
        customChains: [
            {
                network: "base-sepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org",
                },
            },
            {
                network: "base-mainnet",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org",
                },
            },
            {
                network: "pulse-mainnet",
                chainId: 369,
                urls: {
                    apiURL: "https://api.scan.pulsechain.com/api",
                    browserURL: "https://rpc.pulsechain.com",
                },
            },
        ],
    },
    namedAccounts: {
        deployer: 0,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
                },
            },
            {
                version: "0.8.15",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
                },
            },
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
                },
            },
            {
                version: "0.5.16",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 500,
                    },
                },
            },
        ],
    },
    mocha: {
        timeout: 100000,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
        except: ["echidna-test/", "test/", "pancakeSwap/", "@openzeppelin/contracts/"],
    },
    gasReporter: {
        currency: "USD",
        gasPrice: 21,
    },
    abiExporter: {
        path: "./data/abi",
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2,
        except: [],
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    docgen: {
        pages: "items",
        exclude: [
            "RfiToken.sol",
            "test/",
            "pancakeSwap/",
            "echidna-test/",
            "@openzeppelin/contracts/",
        ],
    },
} as HardhatUserConfig;
