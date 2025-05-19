import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('papers')
export class Paper{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column('text', { nullable: true })
    abstract!: string;

    @Column({ nullable: true })
    author!: string;

    @Column('text', { nullable: true })
    content!: string;

    @Column('text', { nullable: true })
    fullText!: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    uploadDate?: Date; 

    @Column({default: false})
    islabeled!: boolean;

    @Column()
    filePath!: string;
}