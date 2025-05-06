require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    baseGoerli: {
      url: process.env.BASE_GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};