import { ethers } from "hardhat";

// const config = {
//     factory: '0xf089a68AcB2Ac39c136DEFBF469201487622de69',
//     router: '0x146Fc64706a91e3C10539CBe317AbC4b859335c7',
//     token: '0xBba4f9c1838837246452D3504981066b27D883e5',
//     masterChef: '0x059217D0AC3a29577e3449E32225E9Dfa9755ec7',
//     usdc: '0x82fa51b3B9d4E2ccbdB902851B598FAe70c93809',
//     weth: '0xCbd7a2Db5F38fad25352c3279A8535EB7137dd39',
//     sushi: '0x43fA137808c0469C82E63fB418b4D8f58279A2f1',
//     lfgWethLp: '0x99F6f025ae923A97ABbe599900b282FADdF0b69D',
//     sushiWethLp: '0x3418780d3CA86C299FFeB8d4fF5E9509f0dD127e',
//     usdcWethPairAddress: '0x9Abb53F7549d3fa8FBF87EED068c3E2b95Ec8329'
// }

const config = {
    factory: '0x3E84D913803b02A4a7f027165E8cA42C14C0FdE7',
    router: '0x7f2ff89d3C45010c976Ea6bb7715DC7098AF786E',
    token: '0x5C67cF2081af555Df2B7A1a0e5464Ab34c2d13af',
    masterChef: '0xb2cB33f27114b966bcCe8460b4fe694819694075',
    usdc: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    weth: '0x4200000000000000000000000000000000000006',
    sushi: '',
    lfgWethLp: '',
    sushiWethLp: '',
    usdcWethPairAddress: ''
}


async function main() {
    const [deployer] = await ethers.getSigners();
    const router = await ethers.getContractAt("PancakeRouter", config.router);

    const weth = await ethers.getContractAt("WETH9", config.weth)
    const usdc = await ethers.getContractAt("MockToken", config.usdc)
    const token = await ethers.getContractAt("MockToken", config.token)

    // await weth.approve(router.address, ethers.utils.parseEther("1000000"))
    // await usdc.approve(router.address, ethers.utils.parseEther("1000000"))
    await token.approve(router.address, ethers.utils.parseEther("1000000"))

    const amount = ethers.utils.parseEther("0.0001")

    // await usdc.mint(deployer.address, amount);
    // await weth.deposit({value: amount})
    // await weth.withdraw(amount)

    const balance = await weth.balanceOf(deployer.address)
    console.log(`balance: ${ethers.utils.formatUnits(balance, 18)}`)

    await router.addLiquidity(weth.address, token.address, amount.div(1800), amount, 0, 0, deployer.address, 1787246406)
    // await router.addLiquidity(weth.address, token.address, amount.div(1800), amount, 0, 0, deployer.address, 1787246406)
    // await router.addLiquidity(weth.address, usdc.address, amount.div(1800), amount, 0, 0, deployer.address, 1787246406)

    // const usdcWethPair = await ethers.getContractAt("MockToken", config.usdcWethPairAddress)
    // console.log(`usdc weth ts: ${await usdcWethPair.totalSupply()}`)

    const masterChef = await ethers.getContractAt("LodgeMasterChef", config.masterChef)

    //deposit LFG
    // await token.approve(config.masterChef, amount);
    // const masterChef = await ethers.getContractAt("LodgeMasterChef", config.masterChef)
    // await masterChef.deposit(0, amount, 0, [])

    //deposit WETH-LFG
    // const wethLfgPair = await ethers.getContractAt("MockToken", config.lfgWethLp)
    // const amount = await wethLfgPair.balanceOf(deployer.address)
    // console.log("depositing", ethers.utils.formatEther(amount))
    // await wethLfgPair.approve(config.masterChef, amount);
    // await masterChef.deposit(3, amount, 0, [])

    //deposit WETH-USDC
    // const wethUsdcPair = await ethers.getContractAt("MockToken", config.usdcWethPairAddress)
    // const amount = await wethUsdcPair.balanceOf(deployer.address)
    // console.log("depositing", ethers.utils.formatEther(amount))
    // await wethUsdcPair.approve(config.masterChef, amount);
    // await masterChef.deposit(4, amount, 0, [])
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });