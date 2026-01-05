import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_details' })
export class UserDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.details, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user?: User | null;

  @Column({ nullable: true })
  guestName?: string | null;

  @Column({ type: 'date' })
  dob: Date;

  @Column()
  birthPlace: string;

  @Column({ type: 'time', nullable: true })
  birthTime?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
