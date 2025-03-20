import {ethers} from "ethers";

import orderbookAbi from "@kuru-labs/kuru-sdk/abi/OrderBook.json";
import {ContractDescriptor, printFunctionSignature} from "../tools/eth-contract";

function printAddBuyOrderInput(data: string) {
    const orderBookInterface = new ethers.utils.Interface(orderbookAbi.abi);
    const decodedData = orderBookInterface.parseTransaction(
        {data: data}
    );

    console.log("Function called:", decodedData.name);
    printFunctionSignature(new ContractDescriptor(orderbookAbi.contractName, orderbookAbi.abi), decodedData.name)

    const price = decodedData.args._price;
    const size = decodedData.args.size;
    console.log(`Limit order placed at price ${price} with size ${size}`);
}

async function main() {

    // Decode transaction data for the OrderBook contract
    let data : string;
    data = "0xa09e904000000000000000000000000000000000000000000000000000000000010d98a20000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000000";
    printAddBuyOrderInput(data);

    data = "0xa09e904000000000000000000000000000000000000000000000000000000000010aed4c00000000000000000000000000000000000000000000000000000000000f90600000000000000000000000000000000000000000000000000000000000000000";
    printAddBuyOrderInput(data);

    data = "0xa09e904000000000000000000000000000000000000000000000000000000000010c430000000000000000000000000000000000000000000000000000000000000f69500000000000000000000000000000000000000000000000000000000000000000";
    printAddBuyOrderInput(data);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});