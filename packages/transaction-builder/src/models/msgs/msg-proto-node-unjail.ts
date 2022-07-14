import { Buffer } from 'buffer'
import { MsgNodeUnjail8 } from '../proto/generated/tx-signer'
import { Any } from '../proto/generated/google/protobuf/any'
import { TxMsg } from './tx-msg'

/**
 * Model representing a MsgNodeUnjail to unjail as an Node in the Pocket Network
 */
export class MsgProtoNodeUnjail extends TxMsg {
  public readonly KEY: string = '/x.nodes.MsgUnjail'
  public readonly AMINO_KEY: string = 'pos/MsgUnjail'
  public readonly nodeAddress: string
  public readonly signerAddress: string

  /**
   * @param {string} nodeAddress - Node address to be unjailed
   * @param {string} signerAddress - Signer address (who triggered the unjail)
   */
  public constructor(nodeAddress: string, signerAddress: string) {
    super()
    this.nodeAddress = nodeAddress
    this.signerAddress = signerAddress
  }
  /**
   * Converts an Msg Object to StdSignDoc
   * @returns {object} - Msg type key value.
   * @memberof MsgNodeUnjail
   */
  public toStdSignDocMsgObj(): object {
    return {
      type: this.AMINO_KEY,
      value: {
        address: this.nodeAddress,
        signer_address: this.signerAddress,
      },
    }
  }

  /**
   * Converts an Msg Object to StdTx
   * @returns {any} - Msg type key value.
   * @memberof MsgNodeUnjail
   */
  public toStdTxMsgObj(): any {
    const data = {
      ValidatorAddr: Buffer.from(this.nodeAddress, 'hex'),
      Signer: Buffer.from(this.signerAddress, 'hex'),
    }

    return Any.fromJSON({
      typeUrl: this.KEY,
      value: Buffer.from(MsgNodeUnjail8.encode(data).finish()).toString(
        'base64'
      ),
    })
  }
}
