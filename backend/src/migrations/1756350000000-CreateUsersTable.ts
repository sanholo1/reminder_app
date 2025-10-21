import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

export class CreateUsersTable1756350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'username', type: 'varchar', length: '100', isUnique: true },
          { name: 'passwordHash', type: 'varchar', length: '255' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    // Require environment variables for admin user creation
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      throw new Error(
        'ADMIN_USER and ADMIN_PASSWORD environment variables must be set for migration'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);
    const id = (await import('crypto')).randomUUID();
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('users')
      .values({
        id,
        username: adminUser,
        passwordHash,
      })
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
