import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OrderService } from 'src/order/order.service';
import { Product, ProductDocument } from 'src/product/product.schema';
import { Order, OrderDocument } from 'src/order/order.schema';

import { sortObject } from './helper/sort-object';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { buildSecureHash } from './helper/build-secure-hash';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private config: ConfigService,
    private orderService: OrderService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  createPaymentUrl(dto: CreatePaymentDto, ip: string): string {
    const vnpUrl = this.config.get<string>('vnpay.url');
    const tmnCode = this.config.get<string>('vnpay.tmnCode');
    const returnUrl = this.config.get<string>('vnpay.returnUrl');
    const secretKey = this.config.get<string>('vnpay.hashSecret');

    const date = new Date();
    const createDate = date
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);

    const vnp_Params: Record<string, string> = {
      vnp_IpAddr: ip,
      vnp_Locale: 'vn',
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_Version: '2.1.0',
      vnp_TmnCode: tmnCode!,
      vnp_OrderType: 'other',
      vnp_TxnRef: dto.orderId,
      vnp_ReturnUrl: returnUrl!,
      vnp_CreateDate: createDate,
      vnp_OrderInfo: dto.orderInfo,
      vnp_Amount: (dto.amount * 100).toString(),
    };

    const sortedParams = sortObject(vnp_Params);
    const secureHash = buildSecureHash(secretKey!, sortedParams);

    const query = new URLSearchParams(sortedParams);
    query.append('vnp_SecureHash', secureHash);

    return `${vnpUrl}?${query.toString()}`;
  }

  /**
   * Process VNPay payment return with transaction support
   * Ensures atomicity: either all updates succeed or all rollback
   */
  async vnpayReturn(query: any) {
    const isValid = this.validateReturnQuery(query);
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    const { vnp_ResponseCode, vnp_TxnRef } = query;

    const order = await this.orderService.findOne(vnp_TxnRef);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // IDEMPOTENCY CHECK: Prevent duplicate processing
    if (order.paymentStatus === 'PAID') {
      this.logger.warn(
        `Payment already processed for order ${vnp_TxnRef}. Skipping duplicate webhook.`,
      );
      return {
        status: 'success',
        message: 'Payment already processed',
        orderId: vnp_TxnRef,
        vnpResponseCode: vnp_ResponseCode,
      };
    }

    // Payment failed - no transaction needed
    if (vnp_ResponseCode !== '00') {
      return {
        status: 'fail',
        orderId: vnp_TxnRef,
        vnpResponseCode: vnp_ResponseCode,
      };
    }

    // Payment succeeded - use transaction for atomicity
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Update order payment status (use _id from the already found order)
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          order._id,
          { paymentStatus: 'PAID' },
          { session, new: true },
        )
        .exec();

      if (!updatedOrder) {
        throw new NotFoundException('Order not found during transaction');
      }

      // 2. Bulk update all products in one operation (no N+1 queries!)
      const bulkOps = order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: {
            $inc: {
              stock: -item.quantity,
              soldQuantity: item.quantity,
            },
          },
        },
      }));

      const bulkResult = await this.productModel.bulkWrite(bulkOps, {
        session,
      });

      // 3. Verify all products were updated
      if (bulkResult.modifiedCount !== order.items.length) {
        throw new BadRequestException(
          `Failed to update stock for some products. Expected ${order.items.length}, updated ${bulkResult.modifiedCount}`,
        );
      }

      // 4. Validate stock levels (prevent negative stock)
      for (const item of order.items) {
        const product = await this.productModel
          .findById(item.productId)
          .session(session)
          .exec();

        if (!product) {
          throw new NotFoundException(
            `Product ${item.productId} not found during stock validation`,
          );
        }

        if (product.stock < 0) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}. Available: ${product.stock + item.quantity}, Required: ${item.quantity}`,
          );
        }
      }

      // 5. Commit transaction - all or nothing!
      await session.commitTransaction();

      this.logger.log(
        `Payment successful for order ${vnp_TxnRef}. Stock updated for ${order.items.length} products.`,
      );

      return {
        status: 'success',
        orderId: vnp_TxnRef,
        vnpResponseCode: vnp_ResponseCode,
      };
    } catch (error) {
      // Rollback transaction on any error
      await session.abortTransaction();

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Transaction failed for order ${vnp_TxnRef}: ${errorMessage}`,
        errorStack,
      );

      // Re-throw the error with context
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Payment processing failed. Stock has been rolled back.',
      );
    } finally {
      // Always end session
      await session.endSession();
    }
  }

  validateReturnQuery(query: any): boolean {
    const secretKey = this.config.get<string>('vnpay.hashSecret');
    const { vnp_SecureHash, ...rest } = query;

    const sorted = sortObject(rest);
    const calculatedHash = buildSecureHash(secretKey!, sorted);

    return vnp_SecureHash === calculatedHash;
  }
}
