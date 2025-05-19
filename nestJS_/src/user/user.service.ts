import { User } from './entities/user.entity';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { VerificationService } from './verification/verification.service';
import { MobileRegisterDto } from './dto/mobile-register.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailLoginDto, MobileLoginDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly verificationService: VerificationService
  ) {}

  async register(dto: MobileRegisterDto | EmailRegisterDto) {
    this.validatePasswordComplexity(dto.password);

    if ('mobile' in dto) {
      return this.mobileRegister(dto);
    } else if ('email' in dto) {
      return this.emailRegister(dto);
    } else {
      throw new HttpException('无效的注册信息', HttpStatus.BAD_REQUEST);
    }
  }

  private async mobileRegister(dto: MobileRegisterDto) {
    await this.verificationService.verifyCode(dto.mobile, dto.code, 'mobile');

    const exist = await this.userRepository.findOne({ where: { mobile: dto.mobile } });
    if (exist) throw new HttpException('手机号已注册', HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      mobile: dto.mobile,
      password: hashedPassword,
      userType: 'mobile',
      mobileVerified: true,
    });

    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  private async emailRegister(dto: EmailRegisterDto) {
    await this.verificationService.verifyCode(dto.email, dto.code, 'email');

    const exist = await this.userRepository.findOne({ where: { email: dto.email } });
    if (exist) throw new HttpException('邮箱已注册', HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      userType: 'email',
      emailVerified: false,
    });

    await this.sendEmailVerification(dto.email);
    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  async findAll(page: number = 1, limit: number = 10,): Promise<{ data: Array<Omit<User, 'password'>>; total: number }> {
    try {
      const [users, total] = await this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: users.map(user => this.sanitizeUser(user)),
        total,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`查询用户列表失败: ${error.message}`);
      } else {
        this.logger.error('查询用户列表失败: 未知类型错误');
      }
      throw new HttpException('获取用户列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      
      if (!user) {
        throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`查询用户失败: ${error.message}`);
      } else {
        this.logger.error('查询用户失败: 未知类型错误');
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('获取用户信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto,): Promise<Omit<User, 'password'>> {
    try {
      const existUser = await this.userRepository.findOneBy({ id });
      if (!existUser) {
        throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
      }

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      await this.userRepository.update(id, updateUserDto);

      const updatedUser = await this.userRepository.findOneBy({ id });
      if (!updatedUser) {
        throw new HttpException('用户信息更新后未找到', HttpStatus.INTERNAL_SERVER_ERROR);
      }else this.logger.log(`用户信息已更新: ID ${id}`);

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`更新用户失败: ${error.message}`);
      } else {
        this.logger.error('更新用户失败: 未知类型错误');
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('更新用户信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.userRepository.delete(id);
      
      if (result.affected === 0) {
        throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
      }
      
      this.logger.log(`用户已删除: ID ${id}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`删除用户失败: ${error.message}`);
      } else {
        this.logger.error('删除用户失败: 未知类型错误');
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('删除用户失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(credentials: MobileLoginDto | EmailLoginDto) {
    if ('mobile' in credentials) {
      return this.mobileLogin(credentials);
    }
    return this.emailLogin(credentials);
  }

  private async mobileLogin(dto: MobileLoginDto) {
    await this.verificationService.verifyCode(dto.mobile, dto.code, 'mobile');
    
    const user = await this.userRepository.findOne({ 
      where: { mobile: dto.mobile }
    });
    if (!user) throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    
    return this.sanitizeUser(user);
  }

  private async emailLogin(dto: EmailLoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email }
    });
    if (!user) throw new HttpException('用户名或密码错误', HttpStatus.NOT_FOUND);

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new HttpException('密码错误', HttpStatus.UNAUTHORIZED);

    return this.sanitizeUser(user);    
  }

  private validatePasswordComplexity(password: string){
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if(!strongRegex.test(password)){
      throw new HttpException(
        '密码必须包含大小写字母、数字和特殊符号,且不少于8位',
        HttpStatus.BAD_REQUEST
      )
    }
  }

  private async sendEmailVerification(email: string) {
    this.logger.log(`发送邮箱验证码至 ${email}`);
  }

async findUserByCredential(credential: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: [
      { mobile: credential },
      { email: credential }
    ]
  });
}

async resetPassword(target: string, newPassword: string) {
  const user = await this.findUserByCredential(target);
  if (!user) {
    if (!user) throw new HttpException('用户名或密码错误', HttpStatus.NOT_FOUND);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await this.userRepository.save(user);

  await this.invalidateTokens(user.id);
  
  return this.sanitizeUser(user);
}

private async invalidateTokens(userId: number) {
  
}

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  } 
}