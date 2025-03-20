import { describe, it, expect } from '@jest/globals';
import { ethers } from "ethers";

import * as KuruConfig from '../config/config.json';
import * as KuruSdk from '@kuru-labs/kuru-sdk'
import { testnetMarketAddresses} from '../src/constants/markets';
import orderbookAbi from "@kuru-labs/kuru-sdk/abi/OrderBook.json";
import {BigNumber} from "@ethersproject/bignumber";
import {LIMIT, MarketParams} from "@kuru-labs/kuru-sdk";

//import {LIMIT} from "@kuru-labs/kuru-sdk";

describe('Orders Test', () => {

    it('Place limit', async () => {
        const { rpcUrl } = KuruConfig;

        const marketAddress = testnetMarketAddresses.DAK_MON;
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log("Network:", network);

        try {
            const balance = await KuruSdk.MarginBalance.getBalance(
                provider,
                KuruConfig.marginAccountAddress,
                process.env.USER_ADDRESS as string,
                ethers.constants.AddressZero
            );
            console.log("Balance: formatted", ethers.utils.formatUnits(balance), "balance.toString():", balance.toString());
        } catch (error) {
            console.error("Error fetching margin balance:", error);
            expect(error).toBeUndefined()
        }

        let gasPrice : null | BigNumber = null;
        try {
            const feeData = await provider.getFeeData();

            // Access the various fee components
            gasPrice = feeData.gasPrice;               // Legacy gas price
            const maxFeePerGas = feeData.maxFeePerGas;       // Max fee per gas (EIP-1559)
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; // Max priority fee per gas (EIP-1559)

            if (gasPrice === null || maxFeePerGas === null || maxPriorityFeePerGas === null) {
                console.error("Fee data is null");
                return;
            }
            // Convert to Gwei for readability
            const gasPriceInGwei = ethers.utils.formatUnits(gasPrice, "gwei");
            const maxFeePerGasInGwei = ethers.utils.formatUnits(maxFeePerGas, "gwei");
            const maxPriorityFeePerGasInGwei = ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei");

            console.log(`Gas Price: ${gasPriceInGwei} Gwei, \nMax Fee Per Gas: ${maxFeePerGasInGwei} Gwei \nMax Priority Fee Per Gas: ${maxPriorityFeePerGasInGwei} Gwei`);
        } catch (error) {
            console.error("Error fetching fee data:", error);
            expect(error).toBeUndefined()
        }

        let marketParams : MarketParams | null = null;
        try {
            marketParams = await KuruSdk.ParamFetcher.getMarketParams(
                provider,
                marketAddress
            );

            console.log("Estimated marketParams:",
                "pricePrecision", marketParams.pricePrecision.toString(),
                "sizePrecision", marketParams.sizePrecision.toString(),
                "baseAssetAddress", marketParams.baseAssetAddress,
                "baseAssetDecimals", marketParams.baseAssetDecimals.toString(),
                "quoteAssetAddress", marketParams.quoteAssetAddress,
                "quoteAssetDecimals", marketParams.quoteAssetDecimals.toString(),
                "tickSize", marketParams.tickSize.toString(),
                "minSize", marketParams.minSize.toString(),
                "maxSize", marketParams.maxSize.toString(),
                "takerFeeBps", marketParams.takerFeeBps.toString(),
                "makerFeeBps", marketParams.makerFeeBps.toString()
            );
        } catch (error) {
            console.error("Error fetching market params:", error);
            expect(error).toBeUndefined()
        }

        if(marketParams === null) {
            console.error("Market params are null");
            return;
        }


        const amount = 1;

        let estimateQuote : number = 0;
        try {
            const orderbook = new ethers.Contract(marketAddress, orderbookAbi.abi, provider);
            const l2Book = await orderbook.getL2Book();
            const vaultParams = await orderbook.getVaultParams();


            estimateQuote = await KuruSdk.CostEstimator.estimateRequiredQuoteForBuy(
                provider,
                marketAddress,
                marketParams,
                amount,
                l2Book,
                vaultParams
            );
            console.log(`The amount of quote (DAK) tokens required to buy a ${amount} MON in a market buy order (estimateQuote): `, estimateQuote);
        } catch (error) {
            console.error("Error estimating required quote for buy:", error);
            expect(error).toBeUndefined()
        }

        if (gasPrice === null) {
            console.error("Gas price is null");
            return;
        }

        try {


            const estimateMarketBuy = await KuruSdk.CostEstimator.estimateMarketBuy(
                provider,
                marketAddress,
                marketParams,
                amount
            );
            console.log(`the amount of MON tokens that would be received for a market buy order given ${amount} DAK. output:`,
                estimateMarketBuy.output, "estimatedGas toString:", estimateMarketBuy.estimatedGas.toString(),
                "totalGasCost:", ethers.utils.formatEther(gasPrice.mul(estimateMarketBuy.estimatedGas)) + " ETH"
            );
        } catch (error) {
            console.info("Error estimating market buy:", error);
            expect(error).toBeUndefined()
        }


        //const price = "135.50"; // Price in quoteAsset (ex:USDC)
        //const size = "10"; // Size in baseAsset (ex:MON)

        // Calculate price as estimateQuote divided by 100 and convert to string


        const divisor = 100;
        if (estimateQuote === 0) {
            console.error("estimateQuote is undefined or failed to be assigned");
            return;
        }
        const calculatedPrice = estimateQuote / divisor;
        const calculatedSize = estimateQuote * 2;
        //const price = calculatedPrice.toString();
        console.log(`Price (estimateQuote / ${divisor}):`, calculatedPrice.toString(), `Size: `, calculatedSize.toString());

        const privateKey = process.env.PRIVATE_KEY as string;
        const signer = new ethers.Wallet(privateKey, provider);
        try {
            const limitOrder: LIMIT = {
                price: calculatedPrice.toString(),
                size: calculatedSize.toString(),
                isBuy: true,
                postOnly: false
            };
            const receipt = await KuruSdk.GTC.placeLimit(
                signer,
                marketAddress,
                marketParams,
                limitOrder
            );
            console.log("Transaction hash:", receipt.transactionHash);
        } catch (error) {
            console.error("Error placing limit buy order:", error);
            expect(error).toBeUndefined()
        }

        expect(1).toEqual(1)
    }, 100000);
});