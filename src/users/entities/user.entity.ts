import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("Uid") // ใช้ UUID แทน ObjectId ของ Mongo
  id: string;

  @Column()
  name: string;

  @Column()
  avatar_type: string;

  @Column()
  avatar_name: string;

  @Column()
  age: number;

  @Column({ nullable: true })
  note: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
