import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** User ID from auth-service (JWT sub) */
  @Column({ type: 'varchar', length: 255, unique: true })
  userId: string;

  @Column({ type: 'boolean', default: false })
  dailyHoroscopeEnabled: boolean;

  /** Preferred time for daily horoscope, e.g. "09:00" (24h) in user's timezone */
  @Column({ type: 'varchar', length: 5, default: '09:00' })
  preferredTime: string;

  /** IANA timezone, e.g. "Asia/Kolkata" */
  @Column({ type: 'varchar', length: 64, default: 'Asia/Kolkata' })
  timezone: string;

  /** FCM or Web Push token for sending push */
  @Column({ type: 'varchar', length: 512, nullable: true })
  deviceToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
