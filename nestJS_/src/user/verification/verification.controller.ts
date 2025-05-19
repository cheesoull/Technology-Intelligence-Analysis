import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBadRequestResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SendCodeDto } from '../dto/send-code.dto';
import { VerifyCodeDto } from '../dto/verify-code.dto';
  
@ApiTags('验证码管理')
@Controller('verification')
export class VerificationController {
    constructor(private readonly verificationService: VerificationService) {}
  
    @Post('/send-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: '发送验证码',
      description: '向指定手机号或邮箱发送验证码(开发模式固定返回12345678)',
    })
    @ApiBody({
      type: SendCodeDto,
      examples: {
        mobileExample: {
          value: { target: '13800138000', type: 'mobile' },
        },
        emailExample: {
          value: { target: 'user@example.com', type: 'email' },
        },
      },
    })
    @ApiResponse({
      status: 200,
      description: '验证码发送成功',
      schema: {
        example: {
          code: 200,
          message: '验证码发送成功',
          data: {
            target: '13800138000',
            type: 'mobile',
            expiresAt: '2023-10-05T12:34:56.789Z',
          },
        },
      },
    })
    @ApiBadRequestResponse({
      description: '参数错误',
      schema: {
        example: {
          code: 400,
          message: [
            'target 必须是手机号或邮箱',
            'type 必须是 mobile 或 email',
          ],
          timestamp: '2023-10-05T12:34:56.789Z',
        },
      },
    })
    @ApiInternalServerErrorResponse({
      description: '服务器内部错误',
      schema: {
        example: {
          code: 500,
          message: '验证码发送失败',
          timestamp: '2023-10-05T12:34:56.789Z',
        },
      },
    })
    async sendCode(@Body() sendCodeDto: SendCodeDto) {
      const { target, type } = sendCodeDto;
      const record = await this.verificationService.createCode(target, type);
      
      return {
        code: 200,
        message: '验证码发送成功',
        data: {
          target: record.target,
          type: record.type,
          expiresAt: record.expiresAt,
        },
      };
    }
  
    @Post('verify-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: '验证验证码',
      description: '验证手机号/邮箱对应的验证码有效性',
    })
    @ApiBody({
      type: VerifyCodeDto,
      examples: {
        mobileExample: {
          value: { target: '13800138000', code: '12345678', type: 'mobile' },
        },
        emailExample: {
          value: { target: 'user@example.com', code: '12345678', type: 'email' },
        },
      },
    })
    @ApiResponse({
      status: 200,
      description: '验证码验证成功',
      schema: {
        example: {
          code: 200,
          message: '验证码验证成功',
          data: {
            isValid: true,
            target: '13800138000',
            type: 'mobile',
          },
        },
      },
    })
    @ApiBadRequestResponse({
      description: '验证失败',
      schema: {
        example: {
          code: 400,
          message: '验证码已过期',
          timestamp: '2023-10-05T12:34:56.789Z',
        },
      },
    })
    async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
        const { target, code, type } = verifyCodeDto;
        const isValid = await this.verificationService.verifyCode(
            target,
            code,
            type
        );
  
        return {
            code: 200,
            message: '验证码验证成功',
            data: {
            isValid,
            target,
            type,
            },
        };
    }
}