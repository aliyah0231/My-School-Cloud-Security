const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

    const network = await provider.getNetwork();
    const block = await provider.getBlockNumber();

    console.log("GANACHE     : TERHUBUNG");
    console.log("CHAIN ID    :", network.chainId.toString());
    console.log("BLOCK NUMBER:", block);
}

main().catch((error) => {
    console.log("GANACHE : GAGAL");
    console.error(error.message);
});
