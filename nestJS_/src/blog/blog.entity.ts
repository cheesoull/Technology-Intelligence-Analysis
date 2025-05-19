import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blogs')
export class Blog{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column('text', { nullable: true })
    content!: string;

    @Column()
    filePath!: string;

    @Column({ nullable: true })
    uploadDate?: Date; 
}