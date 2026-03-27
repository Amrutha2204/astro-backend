import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('family_profiles')
export class FamilyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', length: 255 })
  birthPlace: string;

  @Column({ type: 'varchar', length: 16, default: '12:00:00' })
  birthTime: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  relation: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
