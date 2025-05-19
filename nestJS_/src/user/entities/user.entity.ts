import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity('user')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: number;

    @Column({nullable: true})
    username!: string;

    @Column({nullable: true, unique: true})
    mobile!: string;

    @Column({nullable: true, unique: true})
    email!: string;

    @Column({nullable: true})
    password!: string;

    @Column({
        type: 'enum',
        enum: ['mobile', 'email'],
        default: 'email'
    })
    userType!: string;

    @Column({default: false})
    mobileVerified!: boolean;

    @Column({default: false})
    emailVerified!: boolean;

    @Column({nullable: true})
    avatar!: string;

    @Column('simple-enum', {enum: ['root', 'visitor']})
    role!: string;

    @Column({
        name: 'create_time',
        type: 'timestamp',
        default: ()=>'CURRENT_TIMESTAMP',
    })
    createTime!: Date;

    @Column({
        name: 'update_time',
        type: 'timestamp',
        default: ()=>'CURRENT_TIMESTAMP',
    })
    updateTime!: Date;
}

@Entity()
export class VerificationCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  target!: string; 

  @Column()
  code!: string; 

  @Column({ 
    type: 'enum', 
    enum: ['mobile', 'email'] 
  })
  type!: string; 

  @Column({ default: false })
  used!: boolean; 

  @Column({ type: 'timestamp' })
  expiresAt!: Date; 
}
