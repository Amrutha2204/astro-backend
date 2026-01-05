import {
  Column,
  CreateDateColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
  Index,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { UserDetails } from './user-details.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phoneNumber?: string | null;

  @Column({ nullable: true })
  timezone?: string | null;

  @Column({ nullable: true })
  profilePic?: string | null;

  @Column({ type: 'int', enum: Role, default: Role.User })
  roleId: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserDetails, (details) => details.user, {
    cascade: true,
  })
  details?: UserDetails;
}
