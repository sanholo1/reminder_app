import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSessionIdToReminders1755350794542 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('reminders', 'sessionId');
        if (!hasColumn) {
            await queryRunner.addColumn("reminders", new TableColumn({
                name: "sessionId",
                type: "varchar",
                length: "255",
                isNullable: false,
                default: "''"
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the sessionId column
        await queryRunner.dropColumn("reminders", "sessionId");
    }
}
