import mongoose from 'mongoose';
import OperationalEvent, { IOperationalEvent } from '../../models/OperationalEvent';
import Order from '../../models/Order';
import Product from '../../models/Product';

export class OperationalEventService {
  /**
   * Records a Customer Return event with full reverse logistics and depreciation costs.
   */
  public static async recordCustomerReturn(data: {
    organizationId: string | mongoose.Types.ObjectId;
    orderId?: string | mongoose.Types.ObjectId;
    marketplaceOrderId?: string;
    productId: string | mongoose.Types.ObjectId;
    forwardShipping?: number;
    reverseShipping?: number;
    marketplaceFee?: number;
    packagingLoss?: number;
    damageDepreciation?: number;
    otherCosts?: number;
    notes?: string;
  }): Promise<IOperationalEvent> {
    const fwd = Number(data.forwardShipping) || 0;
    const rev = Number(data.reverseShipping) || 0;
    const fee = Number(data.marketplaceFee) || 0;
    const pkg = Number(data.packagingLoss) || 0;
    const dmg = Number(data.damageDepreciation) || 0;
    const oth = Number(data.otherCosts) || 0;
    const totalLoss = fwd + rev + fee + pkg + dmg + oth;

    const event = await OperationalEvent.create({
      organizationId: data.organizationId,
      orderId: data.orderId,
      marketplaceOrderId: data.marketplaceOrderId,
      productId: data.productId,
      eventType: 'CUSTOMER_RETURN',
      costs: {
        forwardShipping: fwd,
        reverseShipping: rev,
        marketplaceFee: fee,
        packagingLoss: pkg,
        damageDepreciation: dmg,
        productCost: 0,
        repairDisposal: 0,
        otherCosts: oth,
        totalLoss
      },
      notes: data.notes
    });

    if (data.orderId) {
      await Order.updateOne(
        { _id: data.orderId, organizationId: data.organizationId },
        { $set: { status: 'Returned' } }
      );
    }

    return event;
  }

  /**
   * Records a Courier RTO (Return to Origin) event for doorstep delivery refusal or transit failure.
   */
  public static async recordRTO(data: {
    organizationId: string | mongoose.Types.ObjectId;
    orderId?: string | mongoose.Types.ObjectId;
    marketplaceOrderId?: string;
    productId: string | mongoose.Types.ObjectId;
    forwardShipping?: number;
    rtoShipping?: number;
    packagingWaste?: number;
    otherCosts?: number;
    notes?: string;
  }): Promise<IOperationalEvent> {
    const fwd = Number(data.forwardShipping) || 0;
    const rto = Number(data.rtoShipping) || 0;
    const pkg = Number(data.packagingWaste) || 0;
    const oth = Number(data.otherCosts) || 0;
    const totalLoss = fwd + rto + pkg + oth;

    const event = await OperationalEvent.create({
      organizationId: data.organizationId,
      orderId: data.orderId,
      marketplaceOrderId: data.marketplaceOrderId,
      productId: data.productId,
      eventType: 'RTO',
      costs: {
        forwardShipping: fwd,
        reverseShipping: rto,
        marketplaceFee: 0,
        packagingLoss: pkg,
        damageDepreciation: 0,
        productCost: 0,
        repairDisposal: 0,
        otherCosts: oth,
        totalLoss
      },
      notes: data.notes
    });

    if (data.orderId) {
      await Order.updateOne(
        { _id: data.orderId, organizationId: data.organizationId },
        { $set: { status: 'RTO' } }
      );
    }

    return event;
  }

  /**
   * Records Product Damage or Disposal event, adjusting stock in Product inventory.
   */
  public static async recordDamage(data: {
    organizationId: string | mongoose.Types.ObjectId;
    orderId?: string | mongoose.Types.ObjectId;
    productId: string | mongoose.Types.ObjectId;
    productCost: number;
    repairDisposal?: number;
    otherCosts?: number;
    quantity?: number;
    notes?: string;
  }): Promise<IOperationalEvent> {
    const cost = Number(data.productCost) || 0;
    const repair = Number(data.repairDisposal) || 0;
    const oth = Number(data.otherCosts) || 0;
    const qty = Number(data.quantity) || 1;
    const totalLoss = (cost * qty) + repair + oth;

    const event = await OperationalEvent.create({
      organizationId: data.organizationId,
      orderId: data.orderId,
      productId: data.productId,
      eventType: 'DAMAGE',
      costs: {
        forwardShipping: 0,
        reverseShipping: 0,
        marketplaceFee: 0,
        packagingLoss: 0,
        damageDepreciation: 0,
        productCost: cost * qty,
        repairDisposal: repair,
        otherCosts: oth,
        totalLoss
      },
      notes: data.notes
    });

    // Update product stock counts
    await Product.updateOne(
      { _id: data.productId, organizationId: data.organizationId },
      {
        $inc: {
          damagedStock: qty,
          availableStock: -qty
        }
      }
    );

    return event;
  }
}
