import marginAccountAbi from "@kuru-labs/kuru-sdk/abi/MarginAccount.json";

/*
/home/georgy/ws/fl/kuru-sdk/abi/IERC20.json
/home/georgy/ws/fl/kuru-sdk/abi/KuruAMMVault.json
/home/georgy/ws/fl/kuru-sdk/abi/KuruUtils.json
/home/georgy/ws/fl/kuru-sdk/abi/MonadDeployer.json
/home/georgy/ws/fl/kuru-sdk/abi/OrderBook.json
/home/georgy/ws/fl/kuru-sdk/abi/Router.json
/home/georgy/ws/fl/kuru-sdk/abi/Vault.json
 */

import ierc20Abi from "@kuru-labs/kuru-sdk/abi/IERC20.json";
import kuruAMMVaultAbi from "@kuru-labs/kuru-sdk/abi/KuruAMMVault.json";
import kuruUtilsAbi from "@kuru-labs/kuru-sdk/abi/KuruUtils.json";
import monadDeployerAbi from "@kuru-labs/kuru-sdk/abi/MonadDeployer.json";
import orderBookAbi from "@kuru-labs/kuru-sdk/abi/OrderBook.json";
import routerAbi from "@kuru-labs/kuru-sdk/abi/Router.json";
import vaultAbi from "@kuru-labs/kuru-sdk/abi/Vault.json";
import {printAbi} from "../tools/eth-contract";



async function main() {
    printAbi(ierc20Abi);
    printAbi(kuruAMMVaultAbi);
    printAbi(kuruUtilsAbi);
    printAbi(monadDeployerAbi);
    printAbi(orderBookAbi);
    printAbi(routerAbi);
    printAbi(vaultAbi);
    printAbi(marginAccountAbi);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});