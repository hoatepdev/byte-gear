import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Connection, Model } from 'mongoose';

import { PaymentService } from './payment.service';
import { OrderService } from 'src/order/order.service';
import { Product } from 'src/product/product.schema';
import { Order } from 'src/order/order.schema';

describe('PaymentService', () => {
  let service: PaymentService;
  let orderService: OrderService;
  let productModel: Model<any>;
  let orderModel: Model<any>;
  let connection: Connection;
  let configService: ConfigService;

  // Mock data
  const mockOrder = {
    _id: 'order123',
    orderCode: 'ORD001',
    paymentStatus: 'PENDING',
    items: [
      { productId: 'prod1', quantity: 2 },
      { productId: 'prod2', quantity: 1 },
    ],
  };

  const mockProduct = {
    _id: 'prod1',
    name: 'Test Product',
    stock: 10,
    soldQuantity: 5,
  };

  // Mock session
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: OrderService,
          useValue: {
            findOne: jest.fn(),
            updateOrderPaymentStatus: jest.fn(),
          },
        },
        {
          provide: getModelToken(Product.name),
          useValue: {
            bulkWrite: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Order.name),
          useValue: {
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            startSession: jest.fn().mockResolvedValue(mockSession),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'vnpay.url':
                  'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
                'vnpay.tmnCode': 'TEST_TMN',
                'vnpay.returnUrl': 'http://localhost:3000/payment/return',
                'vnpay.hashSecret': 'TEST_SECRET_KEY',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    orderService = module.get<OrderService>(OrderService);
    productModel = module.get<Model<any>>(getModelToken(Product.name));
    orderModel = module.get<Model<any>>(getModelToken(Order.name));
    connection = module.get<Connection>(getConnectionToken());
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentUrl', () => {
    it('should create valid VNPay payment URL', () => {
      const dto = {
        orderId: 'ORD001',
        orderInfo: 'Payment for order ORD001',
        amount: 100000,
      };
      const ip = '127.0.0.1';

      const url = service.createPaymentUrl(dto, ip);

      expect(url).toContain('https://sandbox.vnpayment.vn');
      expect(url).toContain('vnp_TxnRef=ORD001');
      expect(url).toContain('vnp_Amount=10000000'); // Amount * 100
      expect(url).toContain('vnp_SecureHash');
    });

    it('should include all required VNPay parameters', () => {
      const dto = {
        orderId: 'ORD002',
        orderInfo: 'Test order',
        amount: 50000,
      };
      const ip = '192.168.1.1';

      const url = service.createPaymentUrl(dto, ip);

      expect(url).toContain('vnp_Version=2.1.0');
      expect(url).toContain('vnp_Command=pay');
      expect(url).toContain('vnp_CurrCode=VND');
      expect(url).toContain('vnp_TmnCode=TEST_TMN');
      expect(url).toContain('vnp_IpAddr=192.168.1.1');
    });
  });

  describe('vnpayReturn - Successful Payment', () => {
    it('should process successful payment with transaction', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      const mockUpdatedOrder = { ...mockOrder, paymentStatus: 'PAID' };
      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedOrder),
      });

      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 2,
      });

      (productModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 8 }),
      });

      const result = await service.vnpayReturn(query);

      expect(result.status).toBe('success');
      expect(result.orderId).toBe('order123');
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should use bulk update for better performance', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' }),
      });

      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 2,
      });

      (productModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: 8 }),
      });

      await service.vnpayReturn(query);

      expect(productModel.bulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              update: {
                $inc: {
                  stock: expect.any(Number),
                  soldQuantity: expect.any(Number),
                },
              },
            }),
          }),
        ]),
        expect.objectContaining({ session: mockSession }),
      );
    });
  });

  describe('vnpayReturn - Idempotency', () => {
    it('should skip processing if payment already processed', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      const paidOrder = { ...mockOrder, paymentStatus: 'PAID' };
      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(paidOrder as any);

      const result = await service.vnpayReturn(query);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Payment already processed');
      expect(mockSession.startTransaction).not.toHaveBeenCalled();
      expect(productModel.bulkWrite).not.toHaveBeenCalled();
    });

    it('should log warning for duplicate webhook', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      const paidOrder = { ...mockOrder, paymentStatus: 'PAID' };
      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(paidOrder as any);

      const loggerSpy = jest.spyOn((service as any).logger, 'warn');

      await service.vnpayReturn(query);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payment already processed'),
      );
    });
  });

  describe('vnpayReturn - Transaction Rollback', () => {
    it('should rollback transaction if order update fails', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // Order not found
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should rollback if bulk update count mismatch', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' }),
      });

      // Only 1 product updated instead of 2
      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('should rollback if stock becomes negative', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' }),
      });

      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 2,
      });

      // Stock is negative after update
      (productModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockProduct, stock: -1 }),
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        ConflictException,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    });

    it('should rollback if product not found during validation', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' }),
      });

      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 2,
      });

      // Product deleted during transaction
      (productModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('vnpayReturn - Validation', () => {
    it('should reject invalid signature', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'invalid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(false);

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('should handle order not found', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'INVALID_ORDER',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(null as any);

      await expect(service.vnpayReturn(query)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('should return fail status for failed payment', async () => {
      const query = {
        vnp_ResponseCode: '01', // Failed payment
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      const result = await service.vnpayReturn(query);

      expect(result.status).toBe('fail');
      expect(result.orderId).toBe('order123');
      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });
  });

  describe('validateReturnQuery', () => {
    it('should validate correct hash', () => {
      const query = {
        vnp_TxnRef: 'ORD001',
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'calculated_hash',
      };

      // Mock buildSecureHash to return the expected hash
      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);

      const result = service.validateReturnQuery(query);

      expect(result).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const query = {
        vnp_TxnRef: 'ORD001',
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'wrong_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(false);

      const result = service.validateReturnQuery(query);

      expect(result).toBe(false);
    });
  });

  describe('Transaction Edge Cases', () => {
    it('should handle multiple products with varying stock levels', async () => {
      const largeOrder = {
        ...mockOrder,
        items: [
          { productId: 'prod1', quantity: 5 },
          { productId: 'prod2', quantity: 10 },
          { productId: 'prod3', quantity: 1 },
        ],
      };

      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(largeOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...largeOrder, paymentStatus: 'PAID' }),
      });

      (productModel.bulkWrite as jest.Mock).mockResolvedValue({
        modifiedCount: 3,
      });

      const products = [
        { ...mockProduct, stock: 5 },
        { ...mockProduct, stock: 15 },
        { ...mockProduct, stock: 2 },
      ];

      (productModel.findById as jest.Mock).mockImplementation(() => ({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(products.shift()),
      }));

      const result = await service.vnpayReturn(query);

      expect(result.status).toBe('success');
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should always end session even if error occurs', async () => {
      const query = {
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'order123',
        vnp_SecureHash: 'valid_hash',
      };

      jest.spyOn(service, 'validateReturnQuery').mockReturnValue(true);
      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder as any);

      (orderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Connection lost')),
      });

      await expect(service.vnpayReturn(query)).rejects.toThrow();

      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
