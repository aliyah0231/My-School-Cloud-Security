const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

    const address = "0x93a4085523935f4B874B67fb79b2569a6CBFe332";

    const balance = await provider.getBalance(address);

    console.log("WALLET :", address);
    console.log("SALDO  :", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
