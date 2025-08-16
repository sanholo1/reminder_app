import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryColumn1755350794539 implements MigrationInterface {
    name = 'AddCategoryColumn1755350794539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`reminders\` ADD \`category\` varchar(100) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`reminders\` DROP COLUMN \`category\``);
    }

}
