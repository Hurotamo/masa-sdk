[# Masa SDK
 - v3.14.4](../README.md) / [Exports](../modules.md) / Network

# Interface: Network

## Table of contents

### Properties

- [addresses](Network.md#addresses)
- [blockExplorerApiUrls](Network.md#blockexplorerapiurls)
- [blockExplorerUrls](Network.md#blockexplorerurls)
- [chainId](Network.md#chainid)
- [chainName](Network.md#chainname)
- [chainNameShort](Network.md#chainnameshort)
- [gasSlippagePercentage](Network.md#gasslippagepercentage)
- [isTestnet](Network.md#istestnet)
- [nativeCurrency](Network.md#nativecurrency)
- [networkName](Network.md#networkname)
- [rpcUrls](Network.md#rpcurls)
- [skipEip1559](Network.md#skipeip1559)

## Properties

### addresses

• **addresses**: [`Addresses`](Addresses.md)

Masa Curated known Addresses of Contracts like Business logic and tokens

___

### blockExplorerApiUrls

• `Optional` **blockExplorerApiUrls**: `string`[]

set of block explorer api urls

___

### blockExplorerUrls

• `Optional` **blockExplorerUrls**: `string`[]

set of block explorer urls

___

### chainId

• **chainId**: `number`

The networks chain id used to add the network to the wallet

___

### chainName

• **chainName**: `string`

The long chain name that metamask displays or that we use to
offer the user to switch networks

___

### chainNameShort

• **chainNameShort**: `string`

A short version of the Chain Name to be displayed in Buttons or
locations with less space

___

### gasSlippagePercentage

• `Optional` **gasSlippagePercentage**: `number`

the default gas slippage percentage used on some testnets

___

### isTestnet

• **isTestnet**: `boolean`

is this network a test network or not?

___

### nativeCurrency

• `Optional` **nativeCurrency**: `Object`

Information about the native currency

#### Type declaration

| Name | Type |
| :------ | :------ |
| `decimals` | `number` |
| `name` | `string` |
| `symbol` | `string` |

___

### networkName

• **networkName**: [`NetworkName`](../modules.md#networkname)

the technical network name that the SDK knows

___

### rpcUrls

• **rpcUrls**: (`undefined` \| `string`)[]

The list of available rpc urls, required for adding the network
to the wallet

___

### skipEip1559

• `Optional` **skipEip1559**: `boolean`

skip eip1559 gas price calculation for this network
