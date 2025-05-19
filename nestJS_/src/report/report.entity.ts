import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    sourceType!: 'paper' | 'blog';

    @Column()
    sourceId!: number;

    @Column('longtext')
    content!: string;

    @Column({ nullable: true })
    pdfPath!: string;

    @CreateDateColumn()
    createdAt!: Date;
}