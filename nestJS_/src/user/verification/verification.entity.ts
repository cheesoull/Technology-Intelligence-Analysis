import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

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